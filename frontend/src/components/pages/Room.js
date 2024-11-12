import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import RoomContext from "../../context/RoomContext";
import VideoPlayer from "../VideoPlayer";
import ShareScreen from "../ShareScreen";

export default function Room() {
  const { id } = useParams();
  const { ws, me, stream, shareScreen, peers } = useContext(RoomContext);


  useEffect(() => {
    if (me && ws && stream) {
      console.log("User Peer:", me);
      console.log("User Stream:", stream);

      // Emit the "join-room" event to the server to join the specified room
      ws.emit("join-room", { roomId: id, peerId: me.id });

    }
  }, [id,me, ws ,stream]);


  return (
    <div>
      <div>Room ID: {id}</div>
      {stream ? (
        <>
          {/* Local stream video */}
          <VideoPlayer key="local-stream" stream={stream} />
          {/* Peers' video streams */}
          {Object.values(peers).map((peer) => (
            <div key={peer.id} style={{ width: "300px" }}>
              <VideoPlayer stream={peer.stream} />
            </div>
          ))}
        </>
      ) : (
        <p>Waiting for stream...</p>
      )}

      <div style={{ width: "300px" }}>
        <ShareScreen onClick={shareScreen} />
      </div>
    </div>
  );
}
