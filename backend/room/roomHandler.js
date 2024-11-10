const { v4: uuidV4 } = require("uuid");

const rooms = {}; // Object to store rooms with participant data

// Room handler function
const roomHandler = (socket) => {
  const createRoom = () => {
    const roomId = uuidV4(); // Generate a unique room ID
    rooms[roomId] = {}; // Create an empty object to store users in the room
    socket.emit("room-created", { roomId }); // Emit event to notify the user about room creation
    console.log("User created the room:", roomId);
  };

  const joinRoom = ({ roomId, peerId }) => {
    if (!rooms[roomId]) rooms[roomId] = {}; // Initialize room if it doesn't exist
    console.log("User joined the room:", roomId, peerId);

    // Add the user to the room and notify others
    rooms[roomId][peerId] = { peerId }; // Store peerId in the room participants
    socket.join(roomId); // Join the socket to the room
    socket.to(roomId).emit("user-joined", { peerId }); // Notify other users in the room
    socket.emit("get-users", { roomId, participants: rooms[roomId] }); // Send current participants to the user
    console.log(rooms)
    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("User left the room:", peerId);
      leaveRoom({ roomId, peerId });
    });
  };

  const leaveRoom = ({ peerId, roomId }) => {
    if (rooms[roomId]) {
      delete rooms[roomId][peerId]; // Remove the user from the room
      if (Object.keys(rooms[roomId]).length === 0) delete rooms[roomId]; // Clean up room if empty
    }
    // Notify other users that a participant has left
    socket.to(roomId).emit("user-disconnected", peerId);
  };
console.log(rooms)
  // Event listeners
  socket.on("create-room", createRoom);  // Handle room creation
  socket.on("join-room", joinRoom);      // Handle user joining a room
};

module.exports = { roomHandler };
