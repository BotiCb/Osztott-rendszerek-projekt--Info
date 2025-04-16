import os
import json
import threading
import logging


class TextFileDatabase:
    """A simple text file-based database implementation"""

    def __init__(self, db_directory="voting_db"):
        """Initialize the database with a directory to store files"""
        self.db_directory = db_directory
        self.locks = {}  # Dictionary to store mutex locks for each poll

        # Ensure database directory exists
        if not os.path.exists(self.db_directory):
            os.makedirs(self.db_directory)

    def _get_poll_file(self, poll_id):
        """Get the file path for a poll"""
        return os.path.join(self.db_directory, f"{poll_id}.json")

    def _get_lock(self, poll_id):
        """Get or create a lock for a poll"""
        if poll_id not in self.locks:
            self.locks[poll_id] = threading.Lock()
        return self.locks[poll_id]

    def save_vote(self, poll_id, option, voter_id):
        """Save a vote to the database"""
        lock = self._get_lock(poll_id)

        with lock:
            # Create poll file if it doesn't exist
            poll_file = self._get_poll_file(poll_id)
            if os.path.exists(poll_file):
                with open(poll_file, 'r') as f:
                    try:
                        votes = json.load(f)
                    except json.JSONDecodeError:
                        votes = {"options": {}, "voters": []}
            else:
                votes = {"options": {}, "voters": []}

            # Check if user already voted
            if voter_id in votes.get("voters", []):
                return False

            # Add vote
            if "options" not in votes:
                votes["options"] = {}

            if option in votes["options"]:
                votes["options"][option] += 1
            else:
                votes["options"][option] = 1

            if "voters" not in votes:
                votes["voters"] = []

            votes["voters"].append(voter_id)

            # Save to file
            with open(poll_file, 'w') as f:
                json.dump(votes, f)

            return True

    def get_results(self, poll_id):
        """Get results for a poll"""
        lock = self._get_lock(poll_id)

        with lock:
            poll_file = self._get_poll_file(poll_id)
            if os.path.exists(poll_file):
                with open(poll_file, 'r') as f:
                    try:
                        votes = json.load(f)
                        return votes.get("options", {})
                    except json.JSONDecodeError:
                        return {}
            else:
                return {}

    def get_voters(self, poll_id):
        """Get list of voters for a poll"""
        lock = self._get_lock(poll_id)

        with lock:
            poll_file = self._get_poll_file(poll_id)
            if os.path.exists(poll_file):
                with open(poll_file, 'r') as f:
                    try:
                        votes = json.load(f)
                        return votes.get("voters", [])
                    except json.JSONDecodeError:
                        return []
            else:
                return []

    def save_poll(self, poll_data):
        """Save poll configuration"""
        poll_id = poll_data.get("id")
        if not poll_id:
            return False

        active_poll_file = os.path.join(self.db_directory, "active_poll.json")

        with open(active_poll_file, 'w') as f:
            json.dump(poll_data, f)

        return True

    def get_active_poll(self):
        """Get active poll configuration"""
        active_poll_file = os.path.join(self.db_directory, "active_poll.json")

        if os.path.exists(active_poll_file):
            with open(active_poll_file, 'r') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return None
        else:
            return None

    def update_poll_status(self, poll_id, status):
        """Update poll status"""
        active_poll_file = os.path.join(self.db_directory, "active_poll.json")

        if os.path.exists(active_poll_file):
            with open(active_poll_file, 'r') as f:
                try:
                    poll_data = json.load(f)
                    if poll_data.get("id") == poll_id:
                        poll_data["status"] = status
                        with open(active_poll_file, 'w') as f2:
                            json.dump(poll_data, f2)
                        return True
                except json.JSONDecodeError:
                    pass

        return False


# Example usage
if __name__ == "__main__":
    # Initialize logging
    logging.basicConfig(level=logging.INFO)

    # Initialize database
    db = TextFileDatabase()

    # Create a test poll
    test_poll = {
        "id": "test_poll",
        "question": "What is your favorite color?",
        "options": ["Red", "Blue", "Green", "Yellow"],
        "status": "active",
        "end_time": 1682086400  # Some timestamp in the future
    }

    # Save poll
    db.save_poll(test_poll)
    logging.info("Poll saved")

    # Add some votes
    db.save_vote("test_poll", "Red", "user1")
    db.save_vote("test_poll", "Blue", "user2")
    db.save_vote("test_poll", "Red", "user3")
    db.save_vote("test_poll", "Green", "user4")
    logging.info("Votes added")

    # Get results
    results = db.get_results("test_poll")
    logging.info(f"Results: {results}")

    # Get voters
    voters = db.get_voters("test_poll")
    logging.info(f"Voters: {voters}")

    # Update poll status
    db.update_poll_status("test_poll", "closed")
    logging.info("Poll status updated")

    # Get updated poll data
    updated_poll = db.get_active_poll()
    logging.info(f"Updated poll: {updated_poll}")