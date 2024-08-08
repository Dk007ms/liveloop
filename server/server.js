const express = require("express");
const app = express();
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const dotenv=require("dotenv");
const server = http.createServer(app);
const io = socketio(server);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../build")));

// Socket.io connection event
io.on("connection", function (socket) {
  socket.on("send-location", function (data) {
    io.emit("receive-location", { id: socket.id, ...data });
  });
  socket.on("disconnect", function () {
    io.emit("user-disconnected", socket.id);
  });
});

// Handle any requests that don't match the API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../liveloop/build/index.html"));
});

// Start the server
server.listen(process.env.PORT ||4000, () => {
  console.log("Server is listening on port 3000");
});
