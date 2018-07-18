document.addEventListener("DOMContentLoaded", () => {
  // Connect to websocket
  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  //
  // new user protocol
  //

  if (localStorage.getItem("username") == null) {
    document.querySelector("#channel-input").readOnly = true;
    document.querySelector("#message-submission-input").readOnly = true;
  } else {
    document.querySelector("#username-input").readOnly = true;
  }

  //
  // username registration
  //

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

    // remove username submission
    document.querySelector("#username-container").remove();

    // allow message submission and channel creation
    allow_submission("message-submission");
    allow_submission("channel");

    // prevent form from submitting
    return false;
  };

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
      // if user clicks on li, initiates ajax request to fetch messages
      if (e.target && e.target.nodeName == "LI") {
        const request = new XMLHttpRequest();
        const channel_name = e.target.dataset.name;

        request.open("POST", "/fetch_messages");
        request.setRequestHeader("Content-Type", "application/json");

        request.onload = () => {
          const data = JSON.parse(request.responseText);
          display_messages(data);
        };

        const data = JSON.stringify({ channel_name: channel_name });
        request.send(data);
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
      const message_card_template = Handlebars.compile(
        document.querySelector("#message-card").innerHTML
      );

      const message_card = message_card_template({
        username: message.username,
        timestamp: message.timestamp,
        content: message.content
      });

      console.log(message_card);

      // add card into messages container
      document.querySelector("#messages-container").innerHTML += message_card;
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
      document.querySelector("message-submission-input").value = "";
      document.querySelector("message-submission-submit").disabled = true;

      // prevent form from submitting
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
        alert(data);
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

    if (document.getElementById(input).value.length > 0)
      document.getElementById(submit).disabled = false;
    else document.getElementById(submit).disabled = true;
  }

  function display_message_card(message) {
    const message_card_template = Handlebars.compile(
      document.querySelector("#message-card").innerHTML
    );

    const message_card = message_card_template({
      username: message.username,
      timestamp: message.timestamp,
      content: message.content
    });

    console.log(message_card);

    // add card into messages container
    document.querySelector("#messages-container").appendChild(message_card);
  }
});
