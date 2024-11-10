import React, { useContext, useEffect, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import RoomContext from "../../context/RoomContext";
import VideoPlayer from "../VideoPlayer";
import { addPeerAction, removePeerAction } from "../../context/peerActions";
import { peersReducer } from "../../context/peerReducer";
import ShareScreen from "../ShareScreen";

export default function Room() {
  const { id } = useParams();
  const { ws, me, stream, shareScreen } = useContext(RoomContext);
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [participants, setParticipants] = useState([]);

  const getUsers = ({ participants }) => {
    setParticipants(participants);
  };

  useEffect(() => {
    ws.on("get-users", getUsers);

    console.log(participants);
    if (me && ws && stream) {
      console.log("User Peer:", me);
      console.log("User Stream:", stream);

      const peerId = me.id;
      ws.emit("join-room", { roomId: id, peerId });

      ws.on("user-joined", ({ peerId }) => {
        console.log("user-joined event received with peerId:", peerId);

        // Initiate a call to the new user with the local stream
        const call = me.call(peerId, stream);
        console.log("Initiated call to peer:", peerId);

        // Listen for the peer's stream and add it to the state
        call.on("stream", (peerStream) => {
          console.log("Received stream from peer:", peerId);
          dispatch(addPeerAction(peerId, peerStream));
        });
      });

      // Handle incoming calls from other users
      me.on("call", (call) => {
        console.log("Received a call from:", call.peer);

        // Answer the call with the local stream
        call.answer(stream);

        // Listen for the peer's stream on the answered call
        call.on("stream", (peerStream) => {
          console.log("Received peer stream from call:", call.peer);
          dispatch(addPeerAction(call.peer, peerStream));
        });
      });

      // Listen for user disconnects
      ws.on("user-disconnected", (peerId) => {
        console.log("user-disconnected event received with peerId:", peerId);
        dispatch(removePeerAction(peerId));
      });
    }
  }, [id, me, ws, stream]);

  console.log({ peers });

  return (
    <div>
      <div>Room id: {id}</div>
      {stream ? (
        <>
          <VideoPlayer stream={stream} />
          {Object.values(peers).map((peer,id) => (
            <div key={id} style={{ width: "300px" }}>
              <VideoPlayer stream={peer.stream} />
            </div>
          ))}
        </>
      ) : (
        <p>Waiting for stream...</p>
      )}

      <div style={{ width: '300px' }}>
        <ShareScreen onClick={shareScreen} />
      </div>
    </div>
  );
}
