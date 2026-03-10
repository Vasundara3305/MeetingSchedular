import json
from pathlib import Path

from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)

DATA_FILE = Path("meetings.json")


def load_meetings():
    """Load meetings from a local JSON file."""
    if not DATA_FILE.exists():
        return []

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, list):
                return data
    except json.JSONDecodeError:
        pass

    return []


def save_meetings(current_meetings):
    """Save meetings to a local JSON file."""
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(current_meetings, file, indent=2)


def get_next_id(current_meetings):
    """Find the next meeting ID."""
    if not current_meetings:
        return 1
    return max(meeting["id"] for meeting in current_meetings) + 1


meetings = load_meetings()
next_id = get_next_id(meetings)


@app.route("/")
def index():
    sorted_meetings = sorted(meetings, key=lambda item: (item["date"], item["time"]))
    return render_template("index.html", meetings=sorted_meetings)


@app.route("/add", methods=["POST"])
def add_meeting():
    global next_id

    title = request.form.get("title", "").strip()
    date = request.form.get("date", "").strip()
    time = request.form.get("time", "").strip()

    if title and date and time:
        meetings.append(
            {
                "id": next_id,
                "title": title,
                "date": date,
                "time": time,
            }
        )
        next_id += 1
        save_meetings(meetings)

    return redirect(url_for("index"))


@app.route("/delete/<int:meeting_id>", methods=["POST"])
def delete_meeting(meeting_id):
    global meetings
    meetings = [meeting for meeting in meetings if meeting["id"] != meeting_id]
    save_meetings(meetings)
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
