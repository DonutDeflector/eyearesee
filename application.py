import os

from flask import Flask, url_for, flash, render_template, jsonify, request
from flask_socketio import SocketIO, emit

import datetime
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channel_list = []
channel_messages = []


@app.route("/")
def index():
    return render_template("index.html", channel_list=channel_list,
                           channel_messages=channel_messages)


@socketio.on("channel creation")
def channel_creation(data):
    # capture channel name data
    channel_name = data["channel_name"]

    # reset duplicate status
    duplicate = False

    # check for duplicate channel name submission and prevent it
    for channel_item in channel_list:
        if channel_name == channel_item:
            duplicate = True
            break

    if duplicate == False:
        channel_list.append(channel_name)

        # generate dict to store messages for
        channel_dict = {}
        channel_dict["channel_name"] = channel_name
        channel_dict["messages"] = []

        message_submission = {"username": "foo", "content": "bar",
                              "timestamp": datetime.datetime.now()
                              .strftime("%B %d, %Y // %I:%M:%S %p")}

        channel_dict["messages"].append(message_submission.copy())

        message_submission = {"username": "foo", "content": "bar",
                              "timestamp": datetime.datetime.now()
                              .strftime("%B %d, %Y // %I:%M:%S %p")}

        channel_dict["messages"].append(message_submission.copy())

        # add dict to channel messages list
        channel_messages.append(channel_dict)

        emit("update channel list", channel_list, broadcast=True)


@app.route("/fetch_messages", methods=["POST"])
def fetch_messages():
    channel_name = request.json["channel_name"]

    for channel in channel_messages:
        if channel["channel_name"] == channel_name:
            fetched_channel_messages = channel["messages"]

    return jsonify({"channel_name": channel_name,
                    "messages": fetched_channel_messages})
