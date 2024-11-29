import React, { createContext, useEffect, useState, useReducer } from "react";
import Peer from "peerjs";
import socketIoClient from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "../context/peerReducer";
import { addPeerAction, removePeerAction, clearPeersAction } from "../context/peerActions";

export const RoomContext = createContext(null);

const ws = socketIoClient("http://localhost:8000");

export const RoomProvider = ({ children }) => {
  const [me, setMe] = useState(null); // PeerJS instance
  const [stream, setStream] = useState(null); // Local media stream
  const [peers, dispatch] = useReducer(peersReducer, {}); // Peer connections
  const [currentRoom, setCurrentRoom] = useState(null); // Current room ID

  const handleNextClick = () => {
    if (ws && currentRoom) {
      ws.emit("next", { roomId: currentRoom });
      console.log(`Clicked 'Next' - Room ${currentRoom} closed. Both users returned to the queue.`);
      
      // Close all peer connections
      Object.keys(peers).forEach((peerId) => {
        const call = peers[peerId];
        if (call?.close) {
          call.close();
        }
      });

      // Clear peer connections
      dispatch(clearPeersAction());
    }
  };

  const joinQueue = () => {
    if (me && me.id) {
      console.log("Joining queue with peerId:", me.id);
      ws.emit("join-queue", { peerId: me.id });
    }
  };

  useEffect(() => {
    if (!me || !stream) return;

    const handleRoomAssigned = ({ roomId, peerIds }) => {
      if (!peerIds.includes(me.id)) return;
    
      // Clear existing peers before assigning a new room
      dispatch(clearPeersAction());
      console.log("Cleared peers from previous room.");
    
      console.log("Assigned room:", roomId, "Peers:", peerIds);
      setCurrentRoom(roomId);
    
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

    const handleUserDisconnected = ({ peerId }) => {
      console.log(`User with peerId ${peerId} disconnected.`);
      dispatch(removePeerAction(peerId));
    };

    const handleRemovePeer = ({ peerId }) => {
      console.log(`Removing peer with ID: ${peerId}`);
      dispatch(removePeerAction(peerId)); // Remove the peer from Redux state
    };

    ws.on("remove-peer", handleRemovePeer);
    ws.on("room-assigned", handleRoomAssigned);
    ws.on("user-disconnected", handleUserDisconnected);

    return () => {
      ws.off("room-assigned", handleRoomAssigned);
      ws.off("user-disconnected", handleUserDisconnected);
      ws.off("remove-peer", handleRemovePeer);
    };
  }, [me, stream, peers]);

  useEffect(() => {
    const peerId = uuidV4();
    const peer = new Peer(peerId, {
      host: '3.24.134.34',
      port: 9000,
      path: '/',
    });

    peer.on("open", () => {
      console.log("Peer connection established with ID:", peerId);
      setMe(peer);
      joinQueue();
    });

    peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      joinQueue()
      if (peer.disconnected) {
        peer.reconnect();
      }
    });

    peer.on("disconnected", () => {
      console.log("Peer disconnected, attempting to reconnect...");
      peer.reconnect();
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(setStream)
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        
        // Show alert based on the specific error
        if (error.name === "NotFoundError") {
          alert("No camera or microphone found. Please connect a device and reload the page.");
        } else if (error.name === "NotAllowedError") {
          alert("Permission to access camera and microphone was denied. Please enable permissions and reload the page.");
        } else {
          alert("An error occurred while accessing media devices. Please check your settings.");
        }
      });

    return () => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    };
  }, []);

  return (
    <RoomContext.Provider
      value={{
        stream,
        ws,
        me,
        peers,
        currentRoom,
        handleNextClick,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;
