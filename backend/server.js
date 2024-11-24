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

// Middleware to log errors in Socket.IO
io.use((socket, next) => {
    try {
        next();
    } catch (err) {
        console.error("Socket.IO middleware error:", err);
        next(err); // Pass the error to the next middleware
    }
});

// Handle new connections
io.on("connection", (socket) => {
    console.log("A user connected");

    try {
        // Call roomHandler for handling room logic
        roomHandler(socket);

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected");
        });

        // Handle custom errors
        socket.on("error", (err) => {
            console.error("Socket.IO error:", err);
        });
    } catch (err) {
        console.error("Error during connection handling:", err);
    }
});

// Handle uncaught errors in the Node.js process
process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled promise rejection:", err);
});

// Start the server
server.listen(port, (err) => {
    if (err) {
        console.error("Failed to start server:", err);
        process.exit(1); // Exit with failure
    } else {
        console.log(`Listening on port: ${port}`);
    }
});

// Graceful shutdown handling
process.on("SIGINT", () => {
    console.log("Server shutting down...");
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
