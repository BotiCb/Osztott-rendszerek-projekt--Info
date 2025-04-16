#!/usr/bin/env python3
"""
Distributed Voting System Server
Based on simple HTTP server
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
import json
import threading
import socket
import time
import os
import urllib.parse
from datetime import datetime

# Configuration
PORT = 8080
DISPLAY_HOST = "localhost"
DISPLAY_PORT = 8090
DB_DIRECTORY = "voting_db"
ACTIVE_POLL_FILE = "active_poll.json"
UDP_BROADCAST_PORT = 9090

# Ensure database directory exists
if not os.path.exists(DB_DIRECTORY):
    os.makedirs(DB_DIRECTORY)

# Initialize or load active poll
active_poll = {
    "id": "poll_001",
    "question": "What is your favorite programming language?",
    "options": ["Python", "JavaScript", "C++", "Java", "Other"],
    "end_time": (datetime.now().timestamp() + 3600),  # 1 hour from now
    "status": "active"
}

# Save active poll to file
with open(os.path.join(DB_DIRECTORY, ACTIVE_POLL_FILE), 'w') as f:
    json.dump(active_poll, f)

# Database mutex
db_mutex = threading.Lock()


# Function to save vote to database
def save_vote(poll_id, option, voter_id):
    with db_mutex:
        # Create poll file if it doesn't exist
        poll_file = os.path.join(DB_DIRECTORY, f"{poll_id}.json")
        if os.path.exists(poll_file):
            with open(poll_file, 'r') as f:
                votes = json.load(f)
        else:
            votes = {"options": {}, "voters": []}

        # Check if user already voted
        if voter_id in votes["voters"]:
            return False

        # Add vote
        if option in votes["options"]:
            votes["options"][option] += 1
        else:
            votes["options"][option] = 1

        votes["voters"].append(voter_id)

        # Save to file
        with open(poll_file, 'w') as f:
            json.dump(votes, f)

        return True


# Function to get results
def get_results(poll_id):
    with db_mutex:
        poll_file = os.path.join(DB_DIRECTORY, f"{poll_id}.json")
        if os.path.exists(poll_file):
            with open(poll_file, 'r') as f:
                votes = json.load(f)
            return votes["options"]
        else:
            return {}


# Function to notify display about new vote
def notify_display(poll_id, option, voter_id):
    try:
        # Use HTTP GET request to notify display app
        import http.client
        conn = http.client.HTTPConnection(DISPLAY_HOST, DISPLAY_PORT)
        conn.request("GET", f"/update?poll_id={poll_id}&option={urllib.parse.quote(option)}&voter_id={voter_id}")
        response = conn.getresponse()
        conn.close()
        return response.status == 200
    except Exception as e:
        logging.error(f"Failed to notify display: {e}")
        return False


# Function to broadcast poll status via UDP
def broadcast_poll_status(status):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        message = json.dumps({
            "type": "poll_status",
            "status": status,
            "poll_id": active_poll["id"],
            "timestamp": datetime.now().timestamp()
        }).encode('utf-8')
        sock.sendto(message, ('<broadcast>', UDP_BROADCAST_PORT))
        sock.close()
    except Exception as e:
        logging.error(f"Failed to broadcast status: {e}")


# Function to check if poll is still active
def is_poll_active():
    return active_poll["status"] == "active" and datetime.now().timestamp() < active_poll["end_time"]


# HTTP Request Handler
class VotingHandler(BaseHTTPRequestHandler):
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

        # Serve main page
        if path == "/" or path == "/index.html":
            self._set_response()
            with open('index.html', 'rb') as f:
                self.wfile.write(f.read())
            return

        # Get active poll
        elif path == "/api/poll":
            self._set_response('application/json')
            self.wfile.write(json.dumps(active_poll).encode('utf-8'))
            return

        # Get results
        elif path == "/api/results":
            poll_id = query_params.get('poll_id', active_poll["id"])
            results = get_results(poll_id)
            self._set_response('application/json')
            self.wfile.write(json.dumps(results).encode('utf-8'))
            return

        # Serve static files
        elif path.endswith(('.html', '.css', '.js')):
            try:
                with open(path[1:], 'rb') as f:
                    self._set_response('text/html' if path.endswith('.html') else
                                       'text/css' if path.endswith('.css') else
                                       'application/javascript')
                    self.wfile.write(f.read())
                return
            except FileNotFoundError:
                self._set_error_response(404, "File not found")
                return

        # Handle 404
        self._set_error_response(404, "Not found")

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        logging.info(f"POST request to {self.path}")

        if self.path == "/api/vote":
            # Check if poll is active
            if not is_poll_active():
                self._set_error_response(400, "Voting is closed")
                return

            try:
                data = json.loads(post_data.decode('utf-8'))
                poll_id = data.get('poll_id', active_poll["id"])
                option = data.get('option')
                voter_id = data.get('voter_id')

                if not option or not voter_id:
                    self._set_error_response(400, "Missing option or voter_id")
                    return

                # Validate option
                if option not in active_poll["options"]:
                    self._set_error_response(400, "Invalid option")
                    return

                # Save vote
                success = save_vote(poll_id, option, voter_id)
                if not success:
                    self._set_error_response(400, "Already voted")
                    return

                # Notify display
                notify_display(poll_id, option, voter_id)

                # Return success
                self._set_response('application/json')
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))

            except json.JSONDecodeError:
                self._set_error_response(400, "Invalid JSON")
            except Exception as e:
                logging.error(f"Error processing vote: {e}")
                self._set_error_response(500, "Server error")
        else:
            self._set_error_response(404, "Not found")


# Poll status monitoring thread
def poll_monitor():
    while True:
        if active_poll["status"] == "active" and datetime.now().timestamp() >= active_poll["end_time"]:
            active_poll["status"] = "closed"
            broadcast_poll_status("closed")
            logging.info("Poll closed automatically")

            # Save updated poll status
            with open(os.path.join(DB_DIRECTORY, ACTIVE_POLL_FILE), 'w') as f:
                json.dump(active_poll, f)
        time.sleep(5)  # Check every 5 seconds


def run():
    logging.basicConfig(level=logging.INFO)
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, VotingHandler)

    # Start poll monitoring thread
    monitor_thread = threading.Thread(target=poll_monitor, daemon=True)
    monitor_thread.start()

    # Broadcast initial poll status
    broadcast_poll_status("active")

    logging.info(f'Starting voting server on port {PORT}...')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping server...')


if __name__ == '__main__':
    run()