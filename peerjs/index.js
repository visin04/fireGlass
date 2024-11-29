const { PeerServer } = require("peer");

const peerServer = PeerServer({ port: 9000, path: "/" });

console.log("PeerServer is running on port 9000");
