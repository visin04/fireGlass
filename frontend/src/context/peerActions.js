export const ADD_PEER = "ADD_PEER";
export const REMOVE_PEER = "REMOVE_PEER";
export const CLEAR_PEERS = "CLEAR_PEERS"

export const addPeerAction = (peerId, stream) => ({
    type: ADD_PEER,
    payload: { peerId, stream },
});

export const removePeerAction = (peerId) => ({
    type: "REMOVE_PEER",
    payload: { peerId },
  });
  
  export const clearPeersAction = () => ({
    type: "CLEAR_PEERS",
  });