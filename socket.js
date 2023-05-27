let io;

module.exports = {
  init: (httpsServer) => {
    io = require("socket.io")(httpsServer);
    require("./socket/chat");
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
  sockets: {},
};
