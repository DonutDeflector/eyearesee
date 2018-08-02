# Project 2

Web Programming with Python and JavaScript

## Premise

EyeAreSee is a pun on the acronym IRC, which stands for Internet Relay Chat. It
was a popular form of communication during the earlier stages of PC adoption and
continues to be used widely today.

The chat web app allows user to register a username, create channels, change
their status, and view other users' statuses.

## File Overview

### /

#### application.py

The back-end workhorse of the project. It stores users, channels, and messages.
Additionally, it handles the tasks of fetching messages to the user, updating
statuses, registering users, generating channels, and fielding messages.

### static/js/

#### project2.js

The front-end workhorse of the project. It handles protocols for new and
returning users, feeds username, message, and channel submissions to the server,
and displays messages, alerts, and errors.

### templates/

#### index.html

The file in which all of the components of the web app are loaded into.

### templates/handlebars/

#### channel-list-entry.html

The template for items in the channel list. It is utilized when a new channel is
added to the list.

#### error-message.html

The template for error messages. When an error message pops up, a translucent
background is applied and a dialogue box is placed in the middle, describing the
error.

#### message-card.html

The template for messages. It includes the username, messsage content, and
timestamp.

#### no-messages-alert.html

When no messages are fetched from the server, this template is used to notify
the user and give them further instructions. It either instructs users to enter
a channel if they aren't in one already or tells them to start a conversation
if they are in an empty channel.

#### user-list-entry.html

The template for users in the user list. Whenever a new user registers a
username, the template is used to generate a user entry in the list.

### templates/includes/

#### channels-nav.html

The channel side navigation menu. Once opened, it allows the user to create and
view channels.

#### error-message.html

The wrapper `<div>` for error messages. It is used to house the error message
when present and remains invisible to the user otherwise.

#### messages.html

The container in which the most recent 100 message cards are housed. It is
scrollable.

#### message-submission.html

The message submission form, which sits at the bottom of the page.
This is where users are able to enter messages to be submitted to the channel
they are viewing.

#### navbar.html

The navigation bar, which sits at the top of the page. To the left is the
channels icon, which slides in the channel side navigation menu once clicked.
To the right is the users icon, which slides in the users side navigation menu
once clicked. In the middle is the name of the channel that the user is
currently viewing.

#### registered-as.html

This section lives in the users side navigation menu and displays the username
that the user has adopted.

#### status-selection.html

This selector sits at the top of the users side navigation menu. It allows users
to set their status to "Online," "Idle", and "Busy."

#### username-registration.html

This section creates a translucent overlay on the page and greets the user with
an input to select a username.

#### users-nav.html

The users side navigation menu. Once opened, it allows the user to see a list
of users with the status of each user displayed with a colored circle.
Additionally, it houses the `registered-as.html` section at the bottom and the
status selector at the top.

### templates/layouts/

#### default.html

The file in which relevant CSS, JS, and font files are included in the `<head>`.
Handlebars.js templates are also loaded in here.

## Personal Touch

As a personal touch, I decided to add a status selector and user list with
status indicator.
