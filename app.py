from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)

meetings = []
next_id = 1


@app.route("/")
def index():
    return render_template("index.html", meetings=meetings)


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

    return redirect(url_for("index"))


@app.route("/delete/<int:meeting_id>", methods=["POST"])
def delete_meeting(meeting_id):
    global meetings
    meetings = [meeting for meeting in meetings if meeting["id"] != meeting_id]
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
