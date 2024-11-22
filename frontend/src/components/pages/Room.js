import React, { useContext, useEffect } from "react";
import RoomContext from "../../context/RoomContext";
import VideoPlayer from "../VideoPlayer";
import ShareScreen from "../ShareScreen";

export default function Room() {
  const { ws, me, stream, shareScreen, peers, currentRoom } = useContext(RoomContext);

  useEffect(() => {
    if (me && ws && stream) {
      console.log("User Peer:", me.id);
      console.log("User Stream:", stream);

      // Automatically join the queue when the component is mounted
      if (!currentRoom) {
        ws.emit("join-queue", { peerId: me.id });
        console.log("Joined the queue with peerId:", me.id);
      }
    }
   
  }, [me, ws, stream, currentRoom ,peers]);
  console.log(peers,currentRoom)

  return (
    <div>
      {/* Display room information or queue status */}
      <div>
        {currentRoom ? (
          <p>Connected to Room ID: {currentRoom}</p>
        ) : (
          <p>Waiting in the queue...</p>
        )}
      </div>

      {/* Display user's video stream */}
      {stream ? (
        <div>
          {/* Local stream video */}
          <h3>Your Stream</h3>
          <VideoPlayer key="local-stream" stream={stream} />

          {/* Peers' video streams */}
          <h3>Connected Peers</h3>
          {Object.values(peers).map((peer) => (
            <div key={peer.id} style={{ width: "300px" }}>
              <VideoPlayer stream={peer.stream} />
            </div>
          ))}
        </div>
      ) : (
        <p>Waiting for your media stream...</p>
      )}

      {/* Screen sharing button */}
      <div style={{ marginTop: "20px", width: "300px" }}>
        <ShareScreen onClick={shareScreen} />
      </div>
    </div>
  );
}
