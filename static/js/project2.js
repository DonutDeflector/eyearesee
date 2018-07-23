document.addEventListener("DOMContentLoaded", () => {
  //
  // initialize websocket
  //

  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  //
  // new user protocol
  //

  // disable channel and message submission if no username has been chosen
  if (localStorage.getItem("username") == null) {
    document.querySelector("#channel-input").readOnly = true;
    document.querySelector("#message-submission-input").readOnly = true;
  } else {
    document.querySelector("#username-container").remove();
  }

  //
  // returning user protocol
  //

  // if current channel exists in local storage, display messages from channel
  if (localStorage.getItem("current_channel") != null) {
    const current_channel = localStorage.getItem("current_channel");

    document.querySelector(
      "#messages-container"
    ).dataset.name = current_channel;

    set_channel_header(current_channel);
    fetch_messages(current_channel);
  } else {
    const title = "Nothing to see here.";
    const content =
      "Create a channel and start a conversation or join an existing channel \
      and join the conversation.";

    display_no_messages_alert(title, content);
  }

  // set status select option to last value set by user and display username
  if (localStorage.getItem("username") != null) {
    username = localStorage.getItem("username");

    const request = new XMLHttpRequest();

    request.open("POST", "/fetch_user_status");
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = () => {
      const data = JSON.parse(request.responseText);
      const status = data["status"];

      document.querySelector("#user-status-select").value = status;
    };

    const data = JSON.stringify({ username: username });
    request.send(data);

    document.querySelector("#username").innerHTML = username;
  }

  //
  // username registration
  //

  // only runs when username has not been set
  if (localStorage.getItem("username") == null) {
    // disable button to prevent blank submissions
    document.querySelector("#username-submit").disabled = true;

    // enable submission only if there is content in the input field
    document.querySelector("#username-form").onkeyup = () => {
      allow_submission("username");
    };

    // capture username submission
    document.querySelector("#username-form").onsubmit = () => {
      // capture username submission input
      const username = document.querySelector("#username-input").value;

      // add user to server-side users list, authenticates for duplicates
      // server-side
      socket.emit("username registration", {
        username: username
      });

      // clear input, disable blank submissions
      document.querySelector("#username-input").value = "";
      document.querySelector("#username-submit").disabled = true;

      // prevent form from submitting
      return false;
    };
  }

  // successful registration procedure
  socket.on("registration successful", data => {
    // store username in local storage
    const username = data;
    localStorage.setItem("username", username);

    // fade out and remove username submission
    const username_container = document.querySelector("#username-container");
    username_container.style.animationPlayState = "running";
    username_container.addEventListener("animationend", () => {
      username_container.remove();
    });

    // display username
    document.querySelector("#username").innerHTML = username;

    // allow message and channel input
    document.querySelector("#channel-input").readOnly = false;
    document.querySelector("#message-submission-input").readOnly = false;
  });

  //
  // user list
  //

  // when a username is registered, this will add the new user to the list
  socket.on("fetch newest user", data => {
    const username = data.username;
    const status = data.status;

    const user_list_entry_template = Handlebars.compile(
      document.querySelector("#user-list-entry").innerHTML
    );

    const user_list_entry = user_list_entry_template({
      username: username,
      status: status
    });

    document.querySelector("#user-list").innerHTML += user_list_entry;
  });

  //
  // user menu
  //

  document.querySelector("#users-icon").addEventListener("click", () => {
    document.querySelector("#user-container").style.width = "300px";
    document.querySelector("#user-container").style.opacity = "1";
  });

  document.querySelector("#users-close").addEventListener("click", () => {
    document.querySelector("#user-container").style.width = "0";
    document.querySelector("#user-container").style.opacity = "0";
  });

  //
  // user status
  //

  // send status change to the server
  function set_status() {
    username = localStorage.getItem("username");
    status = document.querySelector("#user-status-select").value;

    socket.emit("update status", { username: username, status: status });
  }

  // listen for change in status by the user
  document
    .querySelector("#user-status-select")
    .addEventListener("change", set_status);

  // update status changes
  socket.on("fetch updated status", data => {
    const username = data.username;
    const status = data.status;

    const user_entry_status = document
      .querySelector("#user-" + username)
      .querySelector(".user-status");

    // change color of status circle
    user_entry_status.className = user_entry_status.className.replace(
      /(online|idle|busy)/,
      status.toLowerCase()
    );

    // set correct title for status circle
    user_entry_status.title = status;
  });

  //
  // channel creation
  //

  // disable button to prevent blank submissions
  document.querySelector("#channel-submit").disabled = true;

  // enable submission only if there is content in the input field
  document.querySelector("#channel-form").onkeyup = () => {
    allow_submission("channel");
  };

  // set up sockets for form submission
  socket.on("connect", () => {
    document.querySelector("#channel-form").onsubmit = () => {
      // capture channel input
      const channel_name = document
        .querySelector("#channel-input")
        .value.toLowerCase();

      // emit channel creation
      socket.emit("channel creation", { channel_name: channel_name });

      // clear form and disable submission
      document.querySelector("#channel-input").value = "";
      document.querySelector("#channel-submit").disabled = true;

      // present form from submitting
      return false;
    };
  });

  //
  // channel list
  //

  // add newly created channel to list
  socket.on("update channel list", data => {
    // create channel li element, fetch new channel name
    let channel = document.createElement("li");
    const channel_name = data;

    // add corresponding class, id, data attribute to channel
    channel.id = channel_name;
    channel.classList.add("channel-name");
    channel.dataset.name = channel_name;

    // add text content to channel
    channel.appendChild(document.createTextNode(channel_name));

    // add channel li to channel list
    document.querySelector("#channel-list").appendChild(channel);
  });

  // event listen on list for dynamically generated lis
  document
    .querySelector("#channel-list")
    .addEventListener("click", function(e) {
      // if user clicks on li, fetch message with ajax and store clicked channel
      if (e.target && e.target.nodeName == "LI") {
        // store channel that was clicked on
        const channel_name = e.target.dataset.name;

        // set channel name header to clicked channel
        set_channel_header(channel_name);

        // add channel to local storage
        localStorage.setItem("current_channel", channel_name);

        // enable message input
        if (
          document.querySelector("#messages-container").dataset.name == null
        ) {
          document.querySelector("#message-submission-input").readOnly = false;
        }

        // close channel menu once channel is selected
        document.querySelector("#channel-container").style.width = "0";
        document.querySelector("#channel-container").style.opacity = "0";

        // ajax request to fetch messages
        fetch_messages(channel_name);
      }
    });

  //
  // channel menu
  //

  document.querySelector("#channels-icon").addEventListener("click", () => {
    document.querySelector("#channel-container").style.width = "300px";
    document.querySelector("#channel-container").style.opacity = "1";
  });

  document.querySelector("#channel-close").addEventListener("click", () => {
    document.querySelector("#channel-container").style.width = "0";
    document.querySelector("#channel-container").style.opacity = "0";
  });

  //
  // messages view
  //

  function display_messages(data) {
    const channel_name = data.channel_name;
    const messages = data.messages;

    // clear existing messages in container, if any
    document.querySelector("#messages-container").innerHTML = "";

    // add channel name as data attribute to messages container
    document.querySelector("#messages-container").dataset.name = channel_name;

    // unless there are no messages in the channel, display messages normally
    if (messages.length == 0) {
      const title = "A fresh start.";
      const content =
        "Looks like no one's been here yet. Start a conversation!";

      display_no_messages_alert(title, content);
    } else {
      for (var message of messages) {
        display_message_card(message);
      }
    }
  }

  // scroll message div to bottom whenever a new message is displayed
  const messages_container = document.querySelector("#messages-container");
  const observer = new MutationObserver(scrollToBottom);
  const config = { childList: true };
  observer.observe(messages_container, config);

  function scrollToBottom() {
    const messages_container = document.querySelector("#messages-container");
    messages_container.scrollTop = messages_container.scrollHeight;
  }

  //
  // sending messages
  //

  // disable button to prevent blank submissions
  document.querySelector("#message-submission-submit").disabled = true;

  // enable submission only if there is content in the input field or username
  // in local storage
  document.querySelector("#message-submission-form").onkeyup = () => {
    allow_submission("message-submission");
  };

  // enable submission only if user is in a channel
  if (document.querySelector("#messages-container").dataset.name == null) {
    document.querySelector("#message-submission-input").readOnly = true;
  }

  socket.on("connect", () => {
    document.querySelector("#message-submission-form").onsubmit = () => {
      const content = document.querySelector("#message-submission-input").value;
      const username = localStorage.getItem("username");
      const channel_name = document.querySelector("#messages-container").dataset
        .name;

      // emit channel creation
      socket.emit("message submission", {
        content: content,
        username: username,
        channel_name: channel_name
      });

      // clear form and disable submission
      document.querySelector("#message-submission-input").value = "";
      document.querySelector("#message-submission-submit").disabled = true;

      // present form from submitting
      return false;
    };
  });

  socket.on("notify new message", data => {
    const channel_updated = data;
    const channel_name = document.querySelector("#messages-container").dataset
      .name;

    // if the channel updated matches the current channel, request the new
    // message
    if (channel_updated == channel_name) {
      const request = new XMLHttpRequest();

      request.open("POST", "/fetch_newest_message");
      request.setRequestHeader("Content-Type", "application/json");

      request.onload = () => {
        const data = JSON.parse(request.responseText);
        display_message_card(data);
        limit_messages_displayed(100);
      };

      const data = JSON.stringify({ channel_name: channel_name });
      request.send(data);
    }
  });

  //
  // error messages
  //

  socket.on("error message", data => {
    const content = data;

    const error_message_template = Handlebars.compile(
      document.querySelector("#error-message").innerHTML
    );

    // generate error message card
    const error_message = error_message_template({
      content: content
    });

    const error_message_wrapper = document.querySelector(
      "#error-message-wrapper"
    );

    // add error message to wrapper, raise z-index and opacity for visibility
    error_message_wrapper.innerHTML += error_message;
    error_message_wrapper.style.zIndex = 1000000;
    error_message_wrapper.style.opacity = 1;

    // when the closed button is clicked, fade out and remove error message
    document
      .querySelector("#error-message-close")
      .addEventListener("click", () => {
        error_message_wrapper.style.zIndex = -1;
        error_message_wrapper.style.opacity = 0;
        document.querySelector("#error-message-container").remove();
      });
  });

  //
  // helper functions
  //

  function allow_submission(form) {
    const input = form + "-input";
    const submit = form + "-submit";

    // only allow submission if form isn't empty
    if (document.getElementById(input).value.length > 0)
      document.getElementById(submit).disabled = false;
    else document.getElementById(submit).disabled = true;
  }

  function display_message_card(message) {
    const message_card_template = Handlebars.compile(
      document.querySelector("#message-card").innerHTML
    );

    // generate message card
    const message_card = message_card_template({
      username: message.username,
      timestamp: message.timestamp,
      content: message.content
    });

    // add card into messages container
    document.querySelector("#messages-container").innerHTML += message_card;

    // delete the no messages alert if there is any
    remove_no_messages_alert();
  }

  function display_no_messages_alert(title, content) {
    const no_messages_alert_template = Handlebars.compile(
      document.querySelector("#no-messages-alert").innerHTML
    );

    // generate no messages alert
    const no_messages_alert = no_messages_alert_template({
      title: title,
      content: content
    });

    // add alert to the messages container
    document.querySelector(
      "#messages-container"
    ).innerHTML += no_messages_alert;
  }

  function fetch_messages(channel_name) {
    const request = new XMLHttpRequest();

    request.open("POST", "/fetch_messages");
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = () => {
      const data = JSON.parse(request.responseText);
      display_messages(data);
    };

    const data = JSON.stringify({ channel_name: channel_name });
    request.send(data);
  }

  function limit_messages_displayed(limit_count) {
    const messages_container = document.querySelector("#messages-container");
    const oldest_message = document.querySelector(".message-card");

    if (messages_container.childElementCount > limit_count) {
      oldest_message.remove();
    }
  }

  function set_channel_header(channel_name) {
    document.querySelector("#channel-name").innerHTML = "#" + channel_name;
  }

  function remove_no_messages_alert() {
    const no_messages_alert = document.querySelector(".no-messages-alert");

    // if the no messages alert exists, remove
    if (no_messages_alert != null) {
      no_messages_alert.remove();
    }
  }

  //
  // handlebars helpers
  //

  Handlebars.registerHelper("toLowerCase", function(str) {
    return str.toLowerCase();
  });
});
