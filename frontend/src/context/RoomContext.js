import React, { createContext, useEffect, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import socketIoClient from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "./peerReducer";

export const RoomContext = createContext(null);

// Connecting to the WebSocket server running on localhost
const ws = socketIoClient("ws://localhost:8000");

export const RoomProvider = ({ children }) => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [stream, setStream] = useState(null);
  const [screenSharingId,setScreenSharingId]=useState()
  

  // Navigate to a room and notify the server of joining the room
  const enterRoom = ({ roomId }) => {
    console.log("Navigating to Room ID:", roomId);
    navigate(`/room/${roomId}`);
  };

  const switchScreen = (stream)=>{
    setStream(stream);
    setScreenSharingId(me?.id || "")
  }

  const shareScreen=()=>{
    if(screenSharingId){
      navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(switchScreen)
    }
    else{
      navigator.mediaDevices.getDisplayMedia({}).then(switchScreen)

    }
  }

 
  // Initialize Peer and Media Stream
  useEffect(() => {
    const meId = uuidV4();
    const peer = new Peer(meId);
    setMe(peer);

    console.log("Peer initialized with ID:", peer.id);

    try {
      navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
      })
    } catch (error) {
      console.log("Media error:", error);
    }   
     
  }, []);

  // Set up WebSocket and Peer event listeners after `me` and `stream` are set
  useEffect(() => {
    if (!me || !stream) return;
   ws.on("room-created", enterRoom);
   
    // Listen for new users joining the room
   
    // Handle user disconnection
    ws.on("user-disconnected", (peerId) => {
      console.log("user-disconnected event received with peerId:", peerId);
      
    });

    // Clean up WebSocket and Peer event listeners on unmount
    return () => {
      ws.off("room-created", enterRoom);
      ws.off("user-joined");
      ws.off("user-disconnected");
      me.off("call");
    };
  
  }, [me, stream , ws]);

  return (
    <RoomContext.Provider value={{ stream, ws, me ,shareScreen}}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;
