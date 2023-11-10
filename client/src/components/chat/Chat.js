import React, { useEffect, useState } from "react";
import "./chat.css";
import axios from "axios";
import { uniqBy } from "lodash";


function Chat() {
  // State variables for managing the WebSocket connection, online users, selected user, messages, and new message input.
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [id, setId] = useState(null);
  const [isLogoActive, setLogoActive] = useState(true);
  const [users, setUsers] = useState([]);


  // Function to handle scrolling and determine whether to show the logo
  const onScroll = (e) => {
    setLogoActive(e.target.scrollTop < 100);
  };

  // useEffect to fetch the user ID from the server when the component mounts
  useEffect(() => {
    axios.get("http://localhost:5000/profile").then((response) => {
      setId(response.data.user);
    });
  }, [id]);

  // useEffect to establish WebSocket connection when a user is selected
  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);

  // useEffect to fetch messages when a user is selected
  useEffect(() => {
    if (selectedUserId) {
      axios
        .get("http://localhost:5000/messages/" + selectedUserId)
        .then((res) => {
          setMessages(res.data);
        });
    }
  }, [selectedUserId]);

  // Exclude our user from the online users list
  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  //const disconnected = users.filter(user => !onlinePeopleExclOurUser[user._id]);


  // Remove duplicate messages based on their IDs
  const messagesWithoutDupes = uniqBy(messages, "_id");

  // Function to establish a WebSocket connection
  function connectToWs() {
    const ws = new WebSocket("ws://localhost:5000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect.");
        connectToWs();
      }, 1000);
    });
  }

  // Function to send a message
  function sendMessage(ev) {
    if (ev) ev.preventDefault();
    try {
      ws.send(
        JSON.stringify({
          recipient: selectedUserId,
          text: newMessageText,
        })
      );
    } catch (error) {
      console.log(error);
    }

    setNewMessageText("");

    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  // update online users based on WebSocket messages
  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  // handle incoming WebSocket messages
  function handleMessage(ev) {
    try {
      const messageData = JSON.parse(ev.data);
      if ("online" in messageData) {
        showOnlinePeople(messageData.online);
      } else if ("text" in messageData) {
        if (messageData.sender === selectedUserId) {
          setMessages((prev) => [...prev, { ...messageData }]);
        }
      }
    } catch (error) {
      console.error("Error parsing message data:", error);
    }
  }

  const fetchUsernames = async () => {
    try {
      const response = await axios.get("http://localhost:5000/users");
      setUsers(response.data)
      console.log(users)
    } catch (error) {
      console.error("Error fetching usernames:", error);
    }
  };


  useEffect(() => {
    fetchUsernames();
  }, []);



  return (
    <div>



      {/* Left div showing online users */}
      <div class="split left">
        <div class="centered">



          {Object.keys(onlinePeopleExclOurUser).map((userId) => (
            <div>
              <a
                href="#!"
                className="d-flex justify-content-between"
                onClick={() => {
                  setSelectedUserId(userId);
                }}
              >
                <div
                  key={userId}
                  id={userId}
                  onClick={() => {
                    setSelectedUserId(userId);
                  }}
                >
                 {onlinePeople[userId]} 
                </div>
              </a>
              <hr />
            </div>
          ))}
        </div>
      </div>

      {/* Right div showing selected user's messages */}
      <div class="split right">
        <div class="centered">
          {!selectedUserId && <h2>Select a conversation</h2>}
          {!!selectedUserId && (
            <div
              onScroll={onScroll}
              style={{ height: 300, overflowY: "scroll" }}
            >
              <div>
                {messagesWithoutDupes.map((message) => (
                  <div key={message._id}>
                    <div
                      className={`message ${
                        message.sender === selectedUserId
                          ? "selectedUserId"
                          : "myuser"
                      }`}
                    >
                      <div>{message.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input form for sending new messages */}
          {selectedUserId && (
            <form onSubmit={sendMessage}>
              <input
                type="text"
                value={newMessageText}
                onChange={(ev) => setNewMessageText(ev.target.value)}
                placeholder="Type your message here"
              />
              <button type="submit">Send</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
