document.addEventListener("DOMContentLoaded", () => {
  // Connect to websocket
  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  //
  // username registration
  //

  // if no username in local storage, allow form to be visible and enabled
  if (!localStorage.getItem("username")) {
    document.querySelector("#username-container").style.display = "block";
  }

  // disable button to prevent blank submissions
  document.querySelector("#username-submit").disabled = true;

  // enable submission only if there is content in the input field
  document.querySelector("#username-form").onkeyup = () => {
    if (document.querySelector("#username-input").value.length > 0)
      document.querySelector("#username-submit").disabled = false;
    else document.querySelector("#username-submit").disabled = true;
  };

  // capture username submission
  document.querySelector("#username-form").onsubmit = () => {
    // store input in local storage
    const username = document.querySelector("#username-input").value;
    localStorage.setItem("username", username);

    // hide and disable form
    document.querySelector("#username-container").style.display = "none";
    document.querySelector("#username-input").readOnly = true;
    document.querySelector("#username-submit").disabled = true;

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
    if (document.querySelector("#channel-input").value.length > 0)
      document.querySelector("#channel-submit").disabled = false;
    else document.querySelector("#channel-submit").disabled = true;
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
    const messages = data.messages;

    // clear existing messages in container, if any
    document.querySelector("#messages-container").innerHTML = "";

    for (var message of messages) {
      // generate message card
      let message_card = document.createElement("div");
      message_card.classList.add("message-card");

      // inject content into card
      let message_username = document.createElement("span");
      message_username.appendChild(document.createTextNode(message.username));

      let message_timestamp = document.createElement("span");
      message_timestamp.appendChild(document.createTextNode(message.timestamp));

      let message_content = document.createElement("p");
      message_content.appendChild(document.createTextNode(message.content));

      message_card.appendChild(message_username);
      message_card.appendChild(message_timestamp);
      message_card.appendChild(message_content);

      // add card into messages container
      document.querySelector("#messages-container").appendChild(message_card);
    }
  }

  //
  // sending messages
  //
});
