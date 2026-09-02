const onlineUsers = new Map();

module.exports = (io, socket) => {
  socket.on('notif_bell', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
  });
};

module.exports.onlineUsers = onlineUsers;