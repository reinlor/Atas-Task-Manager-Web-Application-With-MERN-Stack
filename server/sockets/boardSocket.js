module.exports = (io, socket) => {
    // Join specific board room
    socket.on('join_board', (boardId) => {
        if (boardId) {
            socket.join(`board:${boardId}`);
            console.log(`Socket ${socket.id} joined board room board:${boardId}`);
        }
    });

    // Leave board room
    socket.on('leave_board', (boardId) => {
        if (boardId) {
            socket.leave(`board:${boardId}`);
        }
    });

    // Broadcast card drag-and-drop movement to other connected clients in room
    socket.on('card_moved', (data) => {
        const { boardId, cardId, sourceColumnId, destinationColumnId, newPosition } = data;
        socket.to(`board:${boardId}`).emit('card_moved_sync', {
            cardId,
            sourceColumnId,
            destinationColumnId,
            newPosition
        });
    });
};