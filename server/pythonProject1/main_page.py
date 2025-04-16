#!/usr/bin/env python3
"""
Voting Display Application
Shows real-time voting results
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
import json
import threading
import socket
import time
import urllib.parse
import os

# Configuration
PORT = 8090
DB_DIRECTORY = "voting_db"
ACTIVE_POLL_FILE = "active_poll.json"
UDP_LISTEN_PORT = 9090

# Ensure we can access the database directory
if not os.path.exists(DB_DIRECTORY):
    os.makedirs(DB_DIRECTORY)

# Display lock to protect the display from concurrent updates
display_mutex = threading.Lock()

# In-memory cache of results
current_results = {}
active_poll = None
connected_clients = []
client_threads = []


def load_active_poll():
    global active_poll
    try:
        poll_file = os.path.join(DB_DIRECTORY, ACTIVE_POLL_FILE)
        if os.path.exists(poll_file):
            with open(poll_file, 'r') as f:
                active_poll = json.load(f)
                return active_poll
    except Exception as e:
        logging.error(f"Failed to load active poll: {e}")
    return None


def load_results(poll_id):
    try:
        poll_file = os.path.join(DB_DIRECTORY, f"{poll_id}.json")
        if os.path.exists(poll_file):
            with open(poll_file, 'r') as f:
                votes = json.load(f)
                return votes["options"]
    except Exception as e:
        logging.error(f"Failed to load results: {e}")
    return {}


def update_display(poll_id, option=None, voter_id=None):
    """Update the display with new voting data"""
    with display_mutex:
        # Reload results from database
        results = load_results(poll_id)
        current_results[poll_id] = results

        # Print to console for now (in a real app, this would update GUI)
        print("\n" + "=" * 50)
        print("VOTING RESULTS UPDATE")
        print("=" * 50)
        if active_poll:
            print(f"Question: {active_poll['question']}")
        print(f"Poll ID: {poll_id}")

        if option and voter_id:
            print(f"New vote: {option} by {voter_id}")

        print("\nCurrent Results:")
        if results:
            total_votes = sum(results.values())
            for option, count in results.items():
                percentage = (count / total_votes) * 100 if total_votes > 0 else 0
                print(f"{option}: {count} votes ({percentage:.1f}%)")
        else:
            print("No votes yet.")
        print("=" * 50)

        return results


class DisplayHandler(BaseHTTPRequestHandler):
    def _set_response(self, content_type='text/html'):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow CORS
        self.end_headers()

    def _set_error_response(self, status_code=400, message="Bad Request"):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')  # Allow CORS
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))

    def do_GET(self):
        logging.info(f"GET request: {self.path}")

        # Parse URL and query parameters
        path_parts = self.path.split('?')
        path = path_parts[0]
        query_params = {}
        if len(path_parts) > 1:
            query_string = path_parts[1]
            query_params = urllib.parse.parse_qs(query_string)
            # Convert lists to single values
            query_params = {k: v[0] for k, v in query_params.items()}

        # Display main page
        if path == "/" or path == "/display":
            self._set_response()
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Voting Results Display</title>
                <meta http-equiv="refresh" content="5">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 20px; }}
                    h1 {{ color: #333; }}
                    .results {{ margin-top: 20px; }}
                    .option {{ margin: 10px 0; }}
                    .bar {{ 
                        background-color: #4CAF50; 
                        height: 30px; 
                        line-height: 30px;
                        color: white;
                        padding-left: 10px;
                    }}
                </style>
            </head>
            <body>
                <h1>Voting Results</h1>
            """

            if active_poll:
                html += f"<h2>{active_poll['question']}</h2>"
                html += f"<p>Status: {active_poll['status'].upper()}</p>"

                # Display results
                poll_id = active_poll["id"]
                results = current_results.get(poll_id, {})

                if results:
                    total_votes = sum(results.values())
                    html += f"<p>Total votes: {total_votes}</p>"
                    html += "<div class='results'>"

                    for option, count in results.items():
                        percentage = (count / total_votes) * 100 if total_votes > 0 else 0
                        html += f"""
                        <div class='option'>
                            <label>{option}: {count} votes ({percentage:.1f}%)</label>
                            <div class='bar' style='width: {percentage}%'>{count}</div>
                        </div>
                        """

                    html += "</div>"
                else:
                    html += "<p>No votes yet.</p>"
            else:
                html += "<p>No active poll found.</p>"

            html += """
            </body>
            </html>
            """

            self.wfile.write(html.encode('utf-8'))
            return

        # Handle update request from voting server
        elif path == "/update":
            poll_id = query_params.get('poll_id')
            option = query_params.get('option')
            voter_id = query_params.get('voter_id')

            if not poll_id or not option or not voter_id:
                self._set_error_response(400, "Missing parameters")
                return

            results = update_display(poll_id, option, voter_id)

            self._set_response('application/json')
            self.wfile.write(json.dumps(results).encode('utf-8'))
            return

        # Get results in JSON format
        elif path == "/results":
            poll_id = query_params.get('poll_id', active_poll["id"] if active_poll else None)
            if not poll_id:
                self._set_error_response(400, "No poll ID specified")
                return

            results = current_results.get(poll_id, {})

            self._set_response('application/json')
            self.wfile.write(json.dumps(results).encode('utf-8'))
            return

        # Handle 404
        self._set_error_response(404, "Not found")


# UDP listener for poll status updates
def udp_listener():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('', UDP_LISTEN_PORT))

    logging.info(f"UDP listener started on port {UDP_LISTEN_PORT}")

    while True:
        try:
            data, addr = sock.recvfrom(1024)
            message = json.loads(data.decode('utf-8'))

            if message["type"] == "poll_status":
                logging.info(f"Poll status update: {message['status']}")

                # Update active poll status if it's the current poll
                if active_poll and active_poll["id"] == message["poll_id"]:
                    active_poll["status"] = message["status"]
                    logging.info(f"Updated poll status: {active_poll['status']}")
        except Exception as e:
            logging.error(f"Error in UDP listener: {e}")


def client_handler(client_socket, client_address):
    """Handle a connected client"""
    try:
        logging.info(f"New client connected: {client_address}")
        while True:
            # Just keep the connection open for now
            time.sleep(1)
    except:
        logging.info(f"Client disconnected: {client_address}")
    finally:
        if client_socket in connected_clients:
            connected_clients.remove(client_socket)
        client_socket.close()


def run():
    logging.basicConfig(level=logging.INFO)

    # Load active poll
    global active_poll
    active_poll = load_active_poll()
    if active_poll:
        poll_id = active_poll["id"]
        current_results[poll_id] = load_results(poll_id)
        update_display(poll_id)

    # Start UDP listener for poll status updates
    udp_thread = threading.Thread(target=udp_listener, daemon=True)
    udp_thread.start()

    # Start HTTP server
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, DisplayHandler)

    logging.info(f'Starting display server on port {PORT}...')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping display server...')


if __name__ == '__main__':
    run()