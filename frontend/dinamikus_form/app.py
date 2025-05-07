from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from threading import Thread, Event
from queue import Queue, Empty
import time

# Initialize Flask app and database
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///form_submissions.db'  # SQLite database
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Create a Submission model for the database
class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nev = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    eletkor = db.Column(db.Integer, nullable=False)
    version = db.Column(db.Integer, nullable=False, default=1)

# In-memory store for demo purposes
DB = {
    'data': {},
    'version': 1
}

# Thread-safe FIFO queue
task_queue = Queue()
shutdown_flag = Event()

# Worker function to handle background tasks (like processing submissions)
def worker():
    while not shutdown_flag.is_set():
        try:
            payload, resp_queue = task_queue.get(timeout=0.1)
        except Empty:
            continue

        # Current version from "DB"
        current_version = DB['version']
        client_version = payload.get('version')
        update_data = payload.get('data')

        # Optimistic lock check
        if client_version != current_version:
            # conflict → return latest version
            resp_queue.put(('conflict', current_version))
        else:
            # apply update
            DB['data'] = update_data
            DB['version'] += 1
            resp_queue.put(('ok', DB['version']))

        task_queue.task_done()

# Start background worker thread
worker_thread = Thread(target=worker, daemon=True)
worker_thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/kijelzo/update', methods=['POST'])
def update():
    # Parse all form fields into dict
    form_data = request.form.to_dict()
    try:
        client_version = int(form_data.pop('version', 0))
    except ValueError:
        return jsonify(error='invalid version'), 400

    # Package into a task with its own small response queue
    from queue import Queue as RespQueue
    resp_queue = RespQueue()
    task_queue.put(({'data': form_data, 'version': client_version}, resp_queue))

    # Wait for worker response
    try:
        status, new_version = resp_queue.get(timeout=5)
    except Empty:
        return jsonify(error='timeout'), 504

    if status == 'ok':
        # Store the submission in the database
        new_submission = Submission(
            nev=form_data['nev'],
            email=form_data['email'],
            eletkor=form_data['eletkor'],
            version=new_version
        )
        db.session.add(new_submission)
        db.session.commit()

        return jsonify(new_version=new_version), 200
    else:
        # Return the new version to the client for retrying
        return jsonify(error='version conflict', new_version=new_version), 409

@app.route('/kijelzo/current', methods=['GET'])
def current():
    return jsonify(data=DB['data'], version=DB['version'])

# Run the app
if __name__ == '__main__':
    # Create the database tables if they don't exist
    with app.app_context():
        db.create_all()
    app.run(debug=True)
