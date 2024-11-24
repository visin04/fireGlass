export const peersReducer = (state, action) => {
    switch (action.type) {
      case "ADD_PEER":
        return {
          ...state,
          [action.payload.peerId]: {
            id: action.payload.peerId,
            stream: action.payload.stream,
          },
        };
  
      case "REMOVE_PEER":
        const newState = { ...state };
        delete newState[action.payload.peerId];
        return newState;
  
        case "CLEAR_PEERS":
          return {}; // Clear all peers

          
      default:
        return state;
    }
  };
  