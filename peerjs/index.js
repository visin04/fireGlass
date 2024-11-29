const { PeerServer } = require("peer");


PeerServer({ port: 9000, path: "/" });

console.log("server running at 9000")