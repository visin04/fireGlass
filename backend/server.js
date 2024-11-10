const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { roomHandler } = require("./room/roomHandler");

const app = express();


// Enable CORS
app.use(cors());

// Set the port
const port = 8000;
const server = http.createServer(app);

// Set up the Socket.IO server with CORS configuration
const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"], // Allow GET and POST methods
    },
});

// Handle new connections
io.on("connection", (socket) => {
    console.log("a user connected");

    // Call roomHandler for handling room logic
    roomHandler(socket);

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

// Start the server
server.listen(port, () => {
    console.log(`listening on to:${port}`);
});
