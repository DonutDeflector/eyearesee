import os

from flask import Flask, url_for, flash, render_template, jsonify, request
from flask_socketio import SocketIO, emit

import datetime
import json

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# stores users, channels, and messages server-side
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
    """Username Registration"""

    # capture username submitted
    username = data["username"]

    # assign error message for taken usernames
    error_message = "Username already taken."

    # reset duplicate boolean
    duplicate = False

    # check for duplicates, disallow registration if true
    for user in user_list:
        if user["username"] == username:
            duplicate = True
            emit("error message", error_message)
            break

    # only add user to list if they are not a duplicate
    if duplicate == False:
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

        # run successful registration procedure for the client
        emit("registration successful", username)


@socketio.on("update status")
def update_status(data):
    """Update Status"""

    # capture username and status submitted
    username = data["username"]
    status = data["status"]

    # reset searching boolean
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


@app.route("/fetch_user_status", methods=["POST"])
def fetch_user_status():
    """Fetch User Status"""

    # capture username of client
    username = request.json["username"]

    # reset searching boolean
    searching = True

    # find user and fetch status
    while (searching):
        for user in user_list:
            if user["username"] == username:
                status = user["status"]
                searching = False
                return jsonify({"status": status})


@socketio.on("channel creation")
def channel_creation(data):
    """Channel Creation"""

    # capture channel name data
    channel_name = data["channel_name"]

    # error message for duplicate channels
    error_message = "Channel already exists."

    # reset duplicate status
    duplicate = False

    # check for duplicate channel name submission and prevent it
    for channel_item in channel_list:
        if channel_name == channel_item:
            duplicate = True
            emit("error message", error_message)
            break

    # if no duplicates exist, continue protocol
    if duplicate == False:
        # add channel to the channel list
        channel_list.append(channel_name)

        # generate dict to store messages in
        channel_dict = {}
        channel_dict["channel_name"] = channel_name
        channel_dict["messages"] = []

        # add dict to channel messages list
        channel_messages.append(channel_dict)

        # update channel list for all clients
        emit("update channel list", channel_name, broadcast=True)


@app.route("/fetch_messages", methods=["POST"])
def fetch_messages():
    """Fetch Messages"""

    # capture requested channel's name
    channel_name = request.json["channel_name"]

    # reset fetched channel messages to none
    fetched_channel_messages = None

    # reset searching boolean
    searching = True

    # search for channel and fetch messages
    while(searching):
        for channel in channel_messages:
            if channel["channel_name"] == channel_name:
                fetched_channel_messages = channel["messages"]
                searching = False

    # if channel messages returned, return them to the client, else return error
    if fetched_channel_messages != None:
        return jsonify({"channel_name": channel_name,
                        "messages": fetched_channel_messages})
    else:
        return jsonify({"status": "no messages"})


@socketio.on("message submission")
def update_messages(data):
    """Update Messages"""

    # capture message data
    content = data["content"]
    username = data["username"]
    channel_name = data["channel_name"]

    # generate serverside timestamp
    timestamp = datetime.datetime.now().strftime("%I:%M:%S %p // %Y-%d-%m")

    # generate message submission
    message_submission = {"username": username, "content": content,
                          "timestamp": timestamp}

    # reset searching boolean
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
    """Fetch Newest Message"""

    # capture requested channel's name
    channel_name = request.json["channel_name"]

    # reset searching boolean
    searching = True

    # fetch the newest message in the current channel
    while(searching):
        for channel in channel_messages:
            if channel["channel_name"] == channel_name:
                newest_message = channel["messages"][-1]
                searching = False

    # return newest message to the client
    return jsonify(newest_message)
