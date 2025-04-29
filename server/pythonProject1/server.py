import os
import json
import psycopg2
import socket
import threading
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from flask import Flask, send_file

# Configuration
PORT = 8080
FRONTEND_HOST = "localhost"
FRONTEND_PORT = 5173
UDP_BROADCAST_PORT = 9090

app = Flask(__name__, static_folder='frontend')

@app.route('/')
def serve_index():
    return send_file(os.path.join('frontend', 'index.html'))


# Database connection setup
DB_HOST = os.environ.get("PGHOST", "postgres-server-45.postgres.database.azure.com")
DB_USER = os.environ.get("PGUSER", "postgres")
DB_PORT = os.environ.get("PGPORT", "5432")
DB_NAME = os.environ.get("PGDATABASE", "postgres")
DB_PASSWORD = os.environ.get("PGPASSWORD", "szavazo1?")


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            port=DB_PORT,
            database=DB_NAME,
            password=DB_PASSWORD
        )
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None


class VotingHTTPRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', f'http://{FRONTEND_HOST}:{FRONTEND_PORT}')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path == "/api/questions":
            self.get_questions()
        elif path == "/api/results":
            query_params = parse_qs(parsed_path.query)
            question_id = query_params.get('question_id', [None])[0]
            self.get_results(question_id)
        elif path == "/api/user":
            query_params = parse_qs(parsed_path.query)
            email = query_params.get('email', [None])[0]
            self.get_user(email)
        elif path == "/api/user-vote":
            query_params = parse_qs(parsed_path.query)
            user_id = query_params.get('user_id', [None])[0]
            question_id = query_params.get('question_id', [None])[0]
            self.get_user_vote(user_id, question_id)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))

            if self.path == "/api/register":
                self.register_user(data)
            elif self.path == "/api/vote":
                self.submit_vote(data)
            elif self.path == "/api/questions":
                self.add_question(data)
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Not found"}).encode())
        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode())

    def get_questions(self):
        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT q.id, q.text, 
                           o1.id AS option_one_id, o1.text AS option_one_text,
                           o2.id AS option_two_id, o2.text AS option_two_text
                    FROM questions q
                    JOIN options o1 ON q.option_one_id = o1.id
                    JOIN options o2 ON q.option_two_id = o2.id
                    ORDER BY q.id DESC
                """)

                questions = []
                for row in cur.fetchall():
                    questions.append({
                        "id": row[0],
                        "text": row[1],
                        "options": [
                            {"id": row[2], "text": row[3]},
                            {"id": row[4], "text": row[5]}
                        ]
                    })

                self._set_headers()
                self.wfile.write(json.dumps({"questions": questions}).encode())
        except psycopg2.Error as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def get_results(self, question_id):
        if not question_id:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Question ID is required"}).encode())
            return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT o.id, o.text, COUNT(a.id) AS vote_count
                    FROM options o
                    LEFT JOIN answers a ON a.option_id = o.id AND a.question_id = %s
                    WHERE o.id IN (
                        SELECT option_one_id FROM questions WHERE id = %s
                        UNION
                        SELECT option_two_id FROM questions WHERE id = %s
                    )
                    GROUP BY o.id, o.text
                """, (question_id, question_id, question_id))

                results = []
                for row in cur.fetchall():
                    results.append({
                        "option_id": row[0],
                        "option_text": row[1],
                        "votes": row[2]
                    })

                self._set_headers()
                self.wfile.write(json.dumps({"results": results}).encode())
        except psycopg2.Error as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def get_user(self, email):
        if not email:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Email is required"}).encode())
            return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, email FROM users WHERE email = %s", (email,))
                user = cur.fetchone()

                if user:
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "id": user[0],
                        "email": user[1]
                    }).encode())
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "User not found"}).encode())
        except psycopg2.Error as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def get_user_vote(self, user_id, question_id):
        if not user_id or not question_id:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "User ID and Question ID are required"}).encode())
            return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT option_id FROM answers 
                    WHERE user_id = %s AND question_id = %s
                """, (user_id, question_id))

                vote = cur.fetchone()

                self._set_headers()
                if vote:
                    self.wfile.write(json.dumps({
                        "option_id": vote[0]
                    }).encode())
                else:
                    self.wfile.write(json.dumps({
                        "option_id": None
                    }).encode())
        except psycopg2.Error as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def register_user(self, data):
        if 'email' not in data:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Email is required"}).encode())
            return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE email = %s", (data['email'],))
                existing_user = cur.fetchone()

                if existing_user:
                    self._set_headers(409)  # Conflict
                    self.wfile.write(json.dumps({
                        "error": "User already exists",
                        "user_id": existing_user[0]
                    }).encode())
                    return

                cur.execute(
                    "INSERT INTO users (email) VALUES (%s) RETURNING id",
                    (data['email'],)
                )
                user_id = cur.fetchone()[0]
                conn.commit()

                self._set_headers(201)  # Created
                self.wfile.write(json.dumps({
                    "id": user_id,
                    "email": data['email']
                }).encode())
        except psycopg2.Error as e:
            conn.rollback()
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def submit_vote(self, data):
        required_fields = ['user_id', 'question_id', 'option_id']
        for field in required_fields:
            if field not in data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"{field} is required"}).encode())
                return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, option_id FROM answers WHERE user_id = %s AND question_id = %s",
                    (data['user_id'], data['question_id'])
                )
                existing_vote = cur.fetchone()

                status = "submitted"
                if existing_vote:
                    cur.execute(
                        "UPDATE answers SET option_id = %s WHERE id = %s",
                        (data['option_id'], existing_vote[0])
                    )
                    status = "updated"
                else:
                    # Insert new vote
                    cur.execute(
                        """
                        INSERT INTO answers (user_id, question_id, option_id, created_at)
                        VALUES (%s, %s, %s, NOW())
                        """,
                        (data['user_id'], data['question_id'], data['option_id'])
                    )

                conn.commit()

                self._set_headers()
                self.wfile.write(json.dumps({
                    "status": status,
                    "message": f"Vote {status} successfully"
                }).encode())
        except psycopg2.Error as e:
            conn.rollback()
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()

    def add_question(self, data):
        required_fields = ['text', 'option_one', 'option_two', 'user_id']
        for field in required_fields:
            if field not in data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"{field} is required"}).encode())
                return

        conn = get_db_connection()
        if not conn:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": "Database connection failed"}).encode())
            return

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO options (text) VALUES (%s) RETURNING id",
                    (data['option_one'],)
                )
                option_one_id = cur.fetchone()[0]

                cur.execute(
                    "INSERT INTO options (text) VALUES (%s) RETURNING id",
                    (data['option_two'],)
                )
                option_two_id = cur.fetchone()[0]

                cur.execute(
                    """
                    INSERT INTO questions (text, option_one_id, option_two_id)
                    VALUES (%s, %s, %s) RETURNING id
                    """,
                    (data['text'], option_one_id, option_two_id)
                )
                question_id = cur.fetchone()[0]

                conn.commit()

                self._set_headers(201)  # Created
                self.wfile.write(json.dumps({
                    "id": question_id,
                    "text": data['text'],
                    "options": [
                        {"id": option_one_id, "text": data['option_one']},
                        {"id": option_two_id, "text": data['option_two']}
                    ]
                }).encode())
        except psycopg2.Error as e:
            conn.rollback()
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            conn.close()


def broadcast_updates():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    try:
        while True:
            message = json.dumps({
                "type": "update",
                "timestamp": datetime.datetime.now().isoformat()
            })
            sock.sendto(message.encode(), ('<broadcast>', UDP_BROADCAST_PORT))
            threading.Event().wait(10)
    except Exception as e:
        print(f"Broadcasting error: {e}")
    finally:
        sock.close()


def setup_database():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database for setup")
        return False


def run_http_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, VotingHTTPRequestHandler)
    print(f"Starting HTTP server on port {PORT}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("HTTP server stopped")


def run_flask_app():
    app.run(host='0.0.0.0', port=5173)


if __name__ == "__main__":
    flask_thread = threading.Thread(target=run_flask_app, daemon=True)
    flask_thread.start()

    run_http_server()