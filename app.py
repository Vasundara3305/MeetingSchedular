import json
from pathlib import Path

from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)

DATA_FILE = Path("meetings.json")


def load_meetings():
    """Read meetings from JSON storage."""
    if not DATA_FILE.exists():
        return []

    try:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

    if not isinstance(data, list):
        return []

    safe_meetings = []
    for item in data:
        if not isinstance(item, dict):
            continue

        meeting_id = item.get("id")
        title = str(item.get("title", "")).strip()
        date = str(item.get("date", "")).strip()
        time = str(item.get("time", "")).strip()

        if isinstance(meeting_id, int) and title and date and time:
            safe_meetings.append(
                {
                    "id": meeting_id,
                    "title": title,
                    "date": date,
                    "time": time,
                }
            )

    return safe_meetings


def save_meetings(current_meetings):
    """Write meetings to JSON storage."""
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(current_meetings, file, indent=2)


def get_next_id(current_meetings):
    """Return the next numeric ID for a meeting."""
    if not current_meetings:
        return 1
    return max(item["id"] for item in current_meetings) + 1


meetings = load_meetings()


@app.route("/")
def index():
    ordered = sorted(meetings, key=lambda item: (item["date"], item["time"]))
    return render_template("index.html", meetings=ordered)


@app.route("/add", methods=["POST"])
def add_meeting():
    title = request.form.get("title", "").strip()
    date = request.form.get("date", "").strip()
    time = request.form.get("time", "").strip()

    if title and date and time:
        meeting = {
            "id": get_next_id(meetings),
            "title": title,
            "date": date,
            "time": time,
        }
        meetings.append(meeting)
        save_meetings(meetings)

    return redirect(url_for("index"))


@app.route("/delete/<int:meeting_id>", methods=["POST"])
def delete_meeting(meeting_id):
    original_count = len(meetings)
    meetings[:] = [item for item in meetings if item["id"] != meeting_id]

    if len(meetings) != original_count:
        save_meetings(meetings)

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
