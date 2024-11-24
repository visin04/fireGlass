const { v4: uuidV4 } = require("uuid");

let queue = []; // Queue to store waiting users
let rooms = {}; // Object to manage rooms and their participants
let sockets = {}; // Store socket references for each peerId

const roomHandler = (socket) => {
  // Function to handle matchmaking
  const matchUsers = () => {
    try {
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
        } else {
          console.warn(`One or both users' sockets are missing for room: ${roomId}`);
        }
      }
    } catch (error) {
      console.error("Error during matchmaking:", error);
    }
  };

  // User joins the queue
  socket.on("join-queue", ({ peerId }) => {
    try {
      console.log(`User joined queue: ${peerId}`);

      // Add the user to the queue and store the socket reference
      queue.push(peerId);
      sockets[peerId] = socket;

      // Attach peerId to the socket object for later use
      socket.peerId = peerId;

      // Attempt to match users
      matchUsers();
    } catch (error) {
      console.error("Error during user join-queue:", error);
      socket.emit("error", { message: "An error occurred while joining the queue." });
    }
  });
  socket.on("next", ({ roomId }) => {
    const room = rooms[roomId];
  
    if (room) {
      const [user1, user2] = room;
  
      // Notify the opponent that the current user has clicked "next"
      if (sockets[user1]) {
        sockets[user1].emit("opponent-next", { peerId: user2 });
      }
      if (sockets[user2]) {
        sockets[user2].emit("opponent-next", { peerId: user1 });
      }
  
      // Notify both users to remove the peer from their Redux state
      if (sockets[user1]) {
        sockets[user1].emit("remove-peer", { peerId: user2 });
      }
      if (sockets[user2]) {
        sockets[user2].emit("remove-peer", { peerId: user1 });
      }
  
      // Return both users to the queue
      queue.push(user1, user2);
  
      // Notify users that they have been returned to the queue
      if (sockets[user1]) {
        sockets[user1].emit("returned-to-queue", { peerId: user1 });
      }
      if (sockets[user2]) {
        sockets[user2].emit("returned-to-queue", { peerId: user2 });
      }
  
      // Close the room
      delete rooms[roomId];
  
      // Match users again
      matchUsers();
  
      console.log(`Room ${roomId} closed. Users returned to the queue.`);
    }
  });
  
  

  // Handle disconnection
  socket.on("disconnect", () => {
    try {
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
    } catch (error) {
      console.error("Error during user disconnection:", error);
    }
  });

  // Error event handler for socket
  socket.on("error", (err) => {
    console.error("Socket error:", err);
    socket.emit("error", { message: "An internal error occurred." });
  });
};

module.exports = { roomHandler };
