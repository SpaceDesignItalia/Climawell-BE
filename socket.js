// socket.js
const { Server } = require("socket.io");

let onlineUsers = [];

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",

        "http://localhost:5174",
        "https://app.spacedesign-italia.it",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {});

  return io;
};

module.exports = createSocketServer;
