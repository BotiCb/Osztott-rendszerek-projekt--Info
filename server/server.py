import os
import json
import socket
import threading
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from flask import Flask, send_file, send_from_directory
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemxy.orm import sessionmaker, relationship, declarative_base

# Configuration
PORT = 8080
FRONTEND_HOST = "localhost"
FRONTEND_PORT = 5173
UDP_BROADCAST_PORT = 9090

app = Flask(__name__, static_folder='frontend/static', template_folder='frontend')

@app.route('/')
def serve_index():
    return send_file(os.path.join('frontend', 'index.html'))

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.path.join('frontend', 'static'), filename)

# SQLAlchemy setup
DB_HOST = os.environ.get("PGHOST", "postgres-server-45.postgres.database.azure.com")
DB_USER = os.environ.get("PGUSER", "postgres")
DB_PORT = os.environ.get("PGPORT", "5432")
DB_NAME = os.environ.get("PGDATABASE", "postgres")
DB_PASSWORD = os.environ.get("PGPASSWORD", "szavazo1?")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Option(Base):
    __tablename__ = 'options'
    id = Column(Integer, primary_key=True)
    text = Column(String, nullable=False)

class Question(Base):
    __tablename__ = 'questions'
    id = Column(Integer, primary_key=True)
    text = Column(String, nullable=False)
    option_one_id = Column(Integer, ForeignKey('options.id'))
    option_two_id = Column(Integer, ForeignKey('options.id'))
    option_one = relationship("Option", foreign_keys=[option_one_id])
    option_two = relationship("Option", foreign_keys=[option_two_id])

class Answer(Base):
    __tablename__ = 'answers'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=0)
    question_id = Column(Integer, ForeignKey('questions.id'))
    option_id = Column(Integer, ForeignKey('options.id'))
    question = relationship("Question")
    option = relationship("Option")


def get_db_session():
    return SessionLocal()

class VotingHTTPRequestHandler(BaseHTTPRequestHandler):

    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-Type', content_type)

        origin = self.headers.get('Origin')
        allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
        if origin in allowed_origins:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', allowed_origins[0])
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Vary', 'Origin')
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
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))

            if self.path == "/api/vote":
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
        session = get_db_session()
        try:
            questions = session.query(Question).order_by(Question.id.desc()).all()
            result = []
            for q in questions:
                result.append({
                    "id": q.id,
                    "text": q.text,
                    "options": [
                        {"id": q.option_one.id, "text": q.option_one.text},
                        {"id": q.option_two.id, "text": q.option_two.text}
                    ]
                })
            self._set_headers()
            self.wfile.write(json.dumps({"questions": result}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            session.close()

    def get_results(self, question_id):
        if not question_id:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Question ID is required"}).encode())
            return

        session = get_db_session()
        try:
            question = session.query(Question).filter_by(id=question_id).first()
            if not question:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Question not found"}).encode())
                return

            results = []
            for option in [question.option_one, question.option_two]:
                vote_count = session.query(Answer).filter_by(question_id=question.id, option_id=option.id).count()
                results.append({
                    "option_id": option.id,
                    "option_text": option.text,
                    "votes": vote_count
                })
            self._set_headers()
            self.wfile.write(json.dumps({"results": results}).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            session.close()

    def submit_vote(self, data):
        required_fields = ['question_id', 'option_id']
        for field in required_fields:
            if field not in data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"{field} is required"}).encode())
                return

        session = get_db_session()
        try:

            vote = Answer(
                user_id=0,
                question_id=data['question_id'],
                option_id=data['option_id']
            )
            session.add(vote)
            session.commit()
            self._set_headers()
            self.wfile.write(json.dumps({
                "status": "submitted",
                "message": "Vote submitted successfully"
            }).encode())
        except Exception as e:
            session.rollback()
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            session.close()

    def add_question(self, data):
        required_fields = ['text', 'option_one', 'option_two']
        for field in required_fields:
            if field not in data:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": f"{field} is required"}).encode())
                return

        session = get_db_session()
        try:
            option_one = Option(text=data['option_one'])
            option_two = Option(text=data['option_two'])
            session.add(option_one)
            session.add(option_two)
            session.flush()  # get ids

            question = Question(
                text=data['text'],
                option_one_id=option_one.id,
                option_two_id=option_two.id
            )
            session.add(question)
            session.commit()
            self._set_headers(201)
            self.wfile.write(json.dumps({
                "id": question.id,
                "text": question.text,
                "options": [
                    {"id": option_one.id, "text": option_one.text},
                    {"id": option_two.id, "text": option_two.text}
                ]
            }).encode())
        except Exception as e:
            session.rollback()
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": f"Database error: {str(e)}"}).encode())
        finally:
            session.close()

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
    Base.metadata.create_all(engine)
    flask_thread.start()

    run_http_server()
