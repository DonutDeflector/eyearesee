document.addEventListener("DOMContentLoaded", () => {
  // Connect to websocket
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
      // store input in local storage
      const username = document.querySelector("#username-input").value;
      localStorage.setItem("username", username);

      // add user to server-side users list
      socket.emit("username registration", {
        username: username
      });

      // remove username submission
      document.querySelector("#username-container").remove();

      // allow message and channel input
      document.querySelector("#channel-input").readOnly = false;
      document.querySelector("#message-submission-input").readOnly = false;

      // prevent form from submitting
      return false;
    };
  }

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
  // user status
  //

  // send status change to the server
  function set_status() {
    username = localStorage.getItem("username");
    status = document.querySelector("#user-status-select").value;

    socket.emit("update status", { username: username, status: status });
  }

  // update status changes
  socket.on("fetch updated status", data => {
    const username = data.username;
    const status = data.status;

    const user_entry_status = document
      .querySelector("#user-" + username)
      .querySelector(".user-status");

    user_entry_status.innerHTML = "(" + status + ")";
  });

  // listen for change in status by the user
  document
    .querySelector("#user-status-select")
    .addEventListener("change", set_status);

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
    const channel_name = data[data.length - 1];

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

        // ajax request to fetch messages
        fetch_messages(channel_name);
      }
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

    for (var message of messages) {
      display_message_card(message);
    }
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
    document.querySelector("#channel-name").innerHTML = channel_name;
  }
});
