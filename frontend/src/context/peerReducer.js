export const ADD_PEER = "ADD_PEER";
export const REMOVE_PEER = "REMOVE_PEER";

export const peersReducer = (state, action) => {
    switch (action.type) {
        case ADD_PEER:
            return {
                ...state,
                [action.payload.peerId]: {
                    peerId: action.payload.peerId,
                    stream: action.payload.stream,
                },
            };
        case REMOVE_PEER:
            const newState = { ...state };
            delete newState[action.payload.peerId];
            return newState;
        default:
            return state;
    }
};
