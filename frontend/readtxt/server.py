from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import threading

DATA_DIR = "votes"
QUESTION_DIR = "question"
PORT = 12345
lock = threading.Lock()

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(QUESTION_DIR, exist_ok=True)

class VoteHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        request = json.loads(body.decode())

        response_data = {}

        if request["action"] == "vote":
            vote_id = request["vote_id"]
            option = request["option"]
            filename = os.path.join(DATA_DIR, f"{vote_id}.txt")

            with lock:
                with open(filename, "a", encoding="utf-8") as f:
                    f.write(json.dumps(option, ensure_ascii=False) + "\n")


            response_data = {"status": "OK"}

        elif request["action"] == "get_results":
            vote_id = request["vote_id"]
            filename = os.path.join(DATA_DIR, f"{vote_id}.txt")
            results = {}

            with lock:
                if os.path.exists(filename):
                    with open(filename, "r", encoding="utf-8") as f:
                        for line in f:
                            vote = json.loads(line.strip())
                            for question, answer in vote.items():
                                if question not in results:
                                    results[question] = {}
                                results[question][answer] = results[question].get(answer, 0) + 1

            response_data = results

        elif request["action"] == "get_questions":
            vote_id = request["vote_id"]
            filename = os.path.join(QUESTION_DIR, f"{vote_id}.txt")
            questions = []

            if os.path.exists(filename):
                with open(filename, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            parts = line.split(";")
                            question = parts[0]
                            options = parts[1:]
                            questions.append({"question": question, "options": options})

            response_data = questions

        elif request["action"] == "list_votes":
            vote_files = os.listdir(QUESTION_DIR)
            vote_ids = [f[:-4] for f in vote_files if f.endswith(".txt")]
            response_data = vote_ids

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode())

if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), VoteHandler)
    print(f"Többszálas HTTP szerver elindult a {PORT}-es porton...")
    server.serve_forever()