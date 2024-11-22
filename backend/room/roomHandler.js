const { v4: uuidV4 } = require("uuid");

let queue = []; // Queue to store waiting users
let rooms = {}; // Object to manage rooms and their participants
let sockets = {}; // Store socket references for each peerId

const roomHandler = (socket) => {
  // Function to handle matchmaking
  const matchUsers = () => {
    if (queue.length >= 2) {
      const roomId = uuidV4(); // Create a unique room ID
      const [user1, user2] = queue.splice(0, 2); // Take two users from the queue

      // Create room and assign participants
      rooms[roomId] = [user1, user2];

      console.log(`Room created: ${roomId} with ${user1} and ${user2}`);

      // Ensure both users join the room
      if (sockets[user1] && sockets[user2]) {
        sockets[user1].join(roomId);
        sockets[user2].join(roomId);

        // Emit to the respective users using their peerId
        sockets[user1].emit("room-assigned", { roomId, peerIds: [user1, user2] });
        sockets[user2].emit("room-assigned", { roomId, peerIds: [user1, user2] });
      }
    }
  };

  // User joins the queue
  socket.on("join-queue", ({ peerId }) => {
    console.log(`User joined queue: ${peerId}`);

    // Add the user to the queue and store the socket reference
    queue.push(peerId);
    sockets[peerId] = socket;

    // Attach peerId to the socket object for later use
    socket.peerId = peerId;

    // Attempt to match users
    matchUsers();
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const peerId = socket.peerId; // Get peerId from socket object
  
    if (!peerId) {
      console.log("Disconnected user has no associated peerId.");
      return;
    }
  
    console.log(`User disconnected: ${peerId}`);
  
    // Remove the user from the queue
    queue = queue.filter((id) => id !== peerId);
  
    // Remove the user from any room
    for (const roomId in rooms) {
      const participants = rooms[roomId];
  
      if (participants.includes(peerId)) {
        console.log(`Removing ${peerId} from room ${roomId}`);
  
        // Remove the user from the room
        rooms[roomId] = participants.filter((id) => id !== peerId);
  
        // Notify other users in the room about the disconnection
        participants.forEach((id) => {
          if (id !== peerId && sockets[id]) {
            sockets[id].emit("user-disconnected", { peerId });
          }
        });
  
        // If the room has only one participant, close the room
        if (rooms[roomId].length === 1) {
          const remainingPeerId = rooms[roomId][0];
  
          // Delete the room
          delete rooms[roomId];
  
          // Bring the remaining user back to the queue
          queue.push(remainingPeerId);
  
          // Notify the remaining user that they are returned to the queue
          if (sockets[remainingPeerId]) {
            sockets[remainingPeerId].emit("returned-to-queue", {
              peerId: remainingPeerId,
            });
          }
  
          console.log(
            `Room ${roomId} closed. ${remainingPeerId} returned to the queue.`
          );
  
          // Attempt to match users again
          matchUsers();
        }
      }
    }
  
    // Remove the user's socket reference
    delete sockets[peerId];
  });
  
};

module.exports = { roomHandler };
