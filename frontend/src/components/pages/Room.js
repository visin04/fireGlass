import React, { useContext, useEffect } from "react";
import RoomContext from "../../context/RoomContext";
import VideoPlayer from "../VideoPlayer";
import ShareScreen from "../ShareScreen";

export default function Room() {
  const { ws, me, stream, shareScreen, peers, currentRoom, handleNextClick } =
    useContext(RoomContext);

  useEffect(() => {
    if (me && ws && stream) {
      console.log("User Peer:", me.id);
      console.log("User Stream:", stream);

      // Automatically join the queue if not already in a room
      if (!currentRoom) {
        ws.emit("join-queue", { peerId: me.id });
        console.log("Joined the queue with peerId:", me.id);
      }
    }
  }, [me, ws, stream, currentRoom]);

  return (
    <div className="room-container">
      {/* Project Name */}
      <h1 className="project-name">Canadyy</h1>

      {/* Room information */}
      <div className="stream-info">
        {Object.keys(peers).length > 0 ? (
          <h5 className="room-status">Roomed</h5>
        ) : (
          <p className="room-status">Waiting</p>
        )}
      </div>

      {/* Display local and peer video streams */}
      <div className="stream-container">
        {stream ? (
          <>
            <div className="video-player-container">
              <VideoPlayer key="local-stream" stream={stream} />
            </div>
            {Object.entries(peers).length > 0 ? (
              Object.values(peers).map((peer) => (
                <div
                  key={peer.id}
                  className="video-player-container peer-wrapper"
                >
                  <VideoPlayer stream={peer.stream} />
                </div>
              ))
            ) : (
              <div className="black-box">Loading...</div>
            )}
          </>
        ) : (
          <p>Waiting for your media stream...</p>
        )}
      </div>

      {/* Screen sharing and next button */}
      <div className="button-container">
        <ShareScreen onClick={shareScreen} />
        {currentRoom && (
          <button onClick={handleNextClick} className="btn btn-warning">
            Next
          </button>
        )}
      </div>
    </div>
  );
}
