import React, { createContext, useEffect, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import socketIoClient from "socket.io-client";
import { v4 as uuidV4 } from "uuid";
import { peersReducer } from "../context/peerReducer";
import { addPeerAction, removePeerAction } from "../context/peerActions";

export const RoomContext = createContext(null);

const ws = socketIoClient("ws://localhost:8000");

export const RoomProvider = ({ children }) => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [stream, setStream] = useState(null);
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [screenSharingId, setScreenSharingId] = useState(null);

  const enterRoom = ({ roomId }) => {
    console.log("Navigating to Room ID:", roomId);
    navigate(`/room/${roomId}`);
  };

  const switchScreen = (newStream) => {
    setStream(newStream);
    setScreenSharingId(me?.id || "");
  };

  const shareScreen = () => {
    if (screenSharingId) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(switchScreen);
    } else {
      navigator.mediaDevices.getDisplayMedia({ video: true }).then(switchScreen);
    }
  };

  useEffect(() => {
    const meId = uuidV4();
    const peer = new Peer(meId);

    peer.on("open", (id) => {
      console.log("Peer connection open with ID:", id);
      setMe(peer);
    });

    peer.on("error", (err) => console.error("Peer connection error:", err));

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
      })
      .catch((error) => {
        console.log("Error accessing media devices:", error);
      });

    ws.on("room-created", enterRoom);

    return () => {
      ws.off("room-created", enterRoom);
      peer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!me || !stream) return;

    ws.on("user-joined", ({ peerId }) => {
      console.log("Attempting to call peer:", peerId);
      const call = me.call(peerId, stream);
      call.on("stream", (peerStream) => {
        console.log("Received stream from peer:", peerId);
        dispatch(addPeerAction(peerId, peerStream));
      });
      call.on("error", (error) => console.error("Error in call:", error));
    });

    me.on("call", (call) => {
      console.log("Incoming call from:", call.peer);
      call.answer(stream);
      call.on("stream", (peerStream) => {
        console.log("Received peer stream from call:", call.peer);
        dispatch(addPeerAction(call.peer, peerStream));
      });
      call.on("error", (error) => console.error("Error in receiving call stream:", error));
    });

    ws.on("user-disconnected", (peerId) => {
      console.log("User disconnected with peerId:", peerId);
      dispatch(removePeerAction(peerId));
    });

    return () => {
      ws.off("user-joined");
      ws.off("user-disconnected");
      me.off("call");
    };
  }, [me, stream]);

  return (
    <RoomContext.Provider value={{ stream, ws, me, shareScreen, peers }}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;
