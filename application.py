import os

from flask import Flask, url_for, flash, render_template, jsonify, request
from flask_socketio import SocketIO, emit

import datetime
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

user_list = []
channel_list = []
channel_messages = []


@app.route("/")
def index():
    return render_template("index.html",
                           user_list=user_list,
                           channel_list=channel_list)


@socketio.on("username registration")
def username_registration(data):
    username = data["username"]

    # default status to online
    status = "Online"

    # generate dict to store user information
    user_dict = {}
    user_dict["username"] = username
    user_dict["status"] = status

    # add user to users list
    user_list.append(user_dict)

    # broadcast newly registered username to all clients
    emit("fetch newest user", user_dict, broadcast=True)


@socketio.on("update status")
def update_status(data):
    username = data["username"]
    status = data["status"]

    searching = True

    # update status of correct user
    while (searching):
        for user in user_list:
            if user["username"] == username:
                user["status"] = status
                searching = False

    # send updated status to all users
    emit("fetch updated status", {
         "username": username, "status": status}, broadcast=True)


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

        # generate dict to store messages in
        channel_dict = {}
        channel_dict["channel_name"] = channel_name
        channel_dict["messages"] = []

        # add dict to channel messages list
        channel_messages.append(channel_dict)

        emit("update channel list", channel_list, broadcast=True)


@app.route("/fetch_messages", methods=["POST"])
def fetch_messages():
    channel_name = request.json["channel_name"]
    fetched_channel_messages = None

    for channel in channel_messages:
        if channel["channel_name"] == channel_name:
            fetched_channel_messages = channel["messages"]

    if fetched_channel_messages != None:
        return jsonify({"channel_name": channel_name,
                        "messages": fetched_channel_messages})
    else:
        return jsonify({"status": "no messages"})


@socketio.on("message submission")
def update_messages(data):
    # capture message data
    content = data["content"]
    username = data["username"]
    channel_name = data["channel_name"]

    # generate serverside timestamp
    timestamp = datetime.datetime.now().strftime("%B %d, %Y // %I:%M:%S %p")

    # generate message submission
    message_submission = {"username": username, "content": content,
                          "timestamp": timestamp}

    searching = True

    # add message to correct channel, only store most recent 100 messages
    while (searching):
        for channel in channel_messages:
            if channel["channel_name"] == channel_name:
                # add message to array
                channel["messages"].append(message_submission.copy())

                # if number of messages exceeds 100, remove oldest message
                if len(channel["messages"]) > 100:
                    channel["messages"].pop(0)

                # end channel search
                searching = False

    # sends channel name of updated channel to clients
    emit("notify new message", channel_name, broadcast=True)


@app.route("/fetch_newest_message", methods=["POST"])
def fetch_newest_message():
    channel_name = request.json["channel_name"]

    # find the newest message in the current channel
    for channel in channel_messages:
        if channel["channel_name"] == channel_name:
            newest_message = channel["messages"][-1]

    return jsonify(newest_message)
