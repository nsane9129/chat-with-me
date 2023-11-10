const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const ws = require("ws");
const jwt = require("jsonwebtoken");
const Message = require('./models/messageModel');
const User = require('./models/userModel');


// Load environment variables from the .env file 
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

// Set up the Express server
const app = express();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server started on port: ${PORT}`)
);

// Configure middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// Connect to MongoDB
mongoose.connect(
  process.env.MDB_CONNECT,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) return console.error(err);
    console.log("Connected to MongoDB");
  }
);

// Set up routes
app.use("/auth", require("./routers/userRouter"));




// Route to get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, '_id username');
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
  }
});


// Function to extract user data from the request
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });
}

app.get('/profile', (req,res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json('no token');
  }
});




// Route to get messages for a specific user
app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.user;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);

});

// WebSocket setup
const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  // Extract user data from cookies
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookie = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("token="));
    if (tokenCookie) {
      console.log(tokenCookie);
      const token = tokenCookie.split("=")[1];
      if (token) {
        console.log(token);
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          console.log(userData);
          const user = userData.user;
          const username = userData.username;
          connection.user = user;
          connection.username = username;
        });
      }
    }
  }

  // Send the list of online users to all connected clients
  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.user,
          username: c.username,
        })),
      })
    );
  });

  // Handle incoming WebSocket messages
  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text} = messageData;

    if (recipient && text) {
      const messageDoc = await Message.create({
        sender: connection.user,
        recipient,
        text,
      });
  
      [...wss.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender: connection.user,
          recipient,
          _id: messageDoc._id,
        })));
    }
  });
});
