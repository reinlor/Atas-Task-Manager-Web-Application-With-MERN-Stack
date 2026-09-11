const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
let io;

module.exports = {
  initSocket: (server) => {
    io = new Server(server, {
      cors: {
        origin: process.env.ORIGIN_URI || 'http://localhost:5173',
        credentials: true
      }
    });
    io.use((socket, next) => {
      const cookies = socket.handshake.headers.cookie || '';
      const token = cookies.split(';').map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('token='))?.slice(6);

      if (!token) return next(new Error('Authentication required'));

      jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) return next(new Error('Invalid authentication token'));
        socket.user = user;
        next();
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};