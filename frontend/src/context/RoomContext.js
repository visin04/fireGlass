import React, { createContext, useEffect, useState, useReducer } from "react";
import Peer from "peerjs";
import socketIoClient from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "../context/peerReducer";
import { addPeerAction, removePeerAction } from "../context/peerActions";

export const RoomContext = createContext(null);

const ws = socketIoClient("ws://localhost:8000");

export const RoomProvider = ({ children }) => {
  const [me, setMe] = useState(null); // PeerJS instance
  const [stream, setStream] = useState(null); // Local media stream
  const [peers, dispatch] = useReducer(peersReducer, {}); // Peer connections
  const [currentRoom, setCurrentRoom] = useState(null); // Current room ID

  // Helper function: Join matchmaking queue
  const joinQueue = () => {
    if (me) {
      console.log("Joining queue with peerId:", me.id);
      ws.emit("join-queue", { peerId: me.id });
    }
  };

  // Handle WebSocket and PeerJS events
  useEffect(() => {
    if (!me || !stream) return;

    // Event: Room assignment from the server
    const handleRoomAssigned = ({ roomId, peerIds }) => {
      if (!peerIds.includes(me.id)) return;

      console.log("Assigned room:", roomId, "Peers:", peerIds);
      setCurrentRoom(roomId);

      // Handle incoming calls
      me.on("call", (call) => {
        console.log("Incoming call from:", call.peer);
        call.answer(stream);

        call.on("stream", (peerStream) => {
          console.log("Stream received from peer:", call.peer);
          dispatch(addPeerAction(call.peer, peerStream));
        });

        call.on("close", () => {
          console.log("Call closed by peer:", call.peer);
          dispatch(removePeerAction(call.peer));
        });

        call.on("error", (error) => {
          console.error("Error in incoming call:", error);
        });
      });

      // Call all peers in the room
      peerIds.forEach((peerId) => {
        if (peerId !== me.id) {
          console.log("Calling peer:", peerId);
          const call = me.call(peerId, stream);

          call.on("stream", (peerStream) => {
            console.log("Stream received from peer:", peerId);
            dispatch(addPeerAction(peerId, peerStream));
          });

          call.on("close", () => {
            console.log("Call closed by peer:", peerId);
            dispatch(removePeerAction(peerId));
          });

          call.on("error", (error) => {
            console.error("Error in outgoing call:", error);
          });
        }
      });
    };

    // Event: User disconnection
    const handleUserDisconnected = ({peerId}) => {
      console.log(`User with peerId ${peerId} disconnected`);
    
      dispatch(removePeerAction(peerId));
    };

    // Register WebSocket listeners
    ws.on("room-assigned", handleRoomAssigned);
    ws.on("user-disconnected", handleUserDisconnected);

    // Cleanup listeners on unmount
    return () => {
      ws.off("room-assigned", handleRoomAssigned);
      ws.off("user-disconnected", handleUserDisconnected);
    };
  }, [me, stream , peers]);

  // Initialize PeerJS and local media stream
  useEffect(() => {
    const peerId = uuidV4();
    const peer = new Peer(peerId);

    peer.on("open", () => {
      console.log("Peer connection established with ID:", peerId);
      setMe(peer);
      joinQueue(); // Join queue after PeerJS is initialized
    });

    // peer.on('error', (err) => {
    //   console.error('PeerJS error:', err);
      
    //     peer.reconnect();
      
    // });
    
    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        console.log("User media initialized:", mediaStream);
      })
      .catch((error) => {
        console.error("Error accessing user media:", error);
      });

    // Cleanup PeerJS instance on unmount
    return () => {
      if (peer) {
        console.log("Cleaning up PeerJS instance for ID:", peerId);
        peer.destroy();
      }
    };
  }, []);

  // Return context provider
  return (
    <RoomContext.Provider value={{ stream, ws, me, peers, currentRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;
