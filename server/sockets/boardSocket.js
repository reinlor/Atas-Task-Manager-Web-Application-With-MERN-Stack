const Account = require('../models/accountModel');
const Card = require('../models/kanbanModel/cardModel');
const { getBoardAccess } = require('../services/kanbanAccessService');

const boardRooms = new Map();

function emitBoardPresence(io, boardId) {
    const participants = boardRooms.get(boardId);
    io.to(`board:${boardId}`).emit('board_presence', {
        users: participants ? [...participants.values()] : []
    });
}

function leaveCurrentBoard(io, socket) {
    const boardId = socket.boardId;
    if (!boardId) return;

    const participants = boardRooms.get(boardId);
    participants?.delete(socket.id);
    if (participants?.size === 0) boardRooms.delete(boardId);
    socket.leave(`board:${boardId}`);
    delete socket.boardId;
    emitBoardPresence(io, boardId);
}

module.exports = (io, socket) => {
    socket.on('join_board', async (boardId, acknowledge) => {
        try {
            if (typeof boardId !== 'string' || !boardId) {
                return acknowledge?.({ error: 'A board is required' });
            }
            const access = await getBoardAccess(boardId, socket.user.id);
            if (!access.canView) {
                return acknowledge?.({ error: 'You do not have access to this board' });
            }

            leaveCurrentBoard(io, socket);
            const account = await Account.findById(socket.user.id).select('username');
            socket.join(`board:${boardId}`);
            socket.boardId = boardId;

            if (!boardRooms.has(boardId)) boardRooms.set(boardId, new Map());
            boardRooms.get(boardId).set(socket.id, {
                id: socket.user.id,
                username: account?.username || 'Someone'
            });

            acknowledge?.({ ok: true });
            emitBoardPresence(io, boardId);
        } catch (error) {
            console.error('Unable to join board room:', error.message);
            acknowledge?.({ error: 'Unable to join board room' });
        }
    });

    socket.on('leave_board', (boardId) => {
        if (!boardId || socket.boardId === boardId) leaveCurrentBoard(io, socket);
    });

    socket.on('card_moved', async (data) => {
        if (!socket.boardId || !data || data.boardId !== socket.boardId) return;
        try {
            const access = await getBoardAccess(data.boardId, socket.user.id);
            if (!access.canEdit) return;

            const { cardId, sourceColumnId, destinationColumnId, newPosition } = data;
            const destination = access.board.columns.id(destinationColumnId);
            const source = access.board.columns.id(sourceColumnId);
            const card = await Card.findOne({ _id: cardId, boardId: data.boardId });
            if (
                !source ||
                !destination ||
                !card ||
                card.columnId.toString() !== destinationColumnId ||
                !destination.cards.some((id) => id.toString() === cardId) ||
                !Number.isInteger(newPosition) ||
                newPosition < 0 ||
                newPosition >= destination.cards.length
            ) {
                return;
            }

            socket.to(`board:${data.boardId}`).emit('card_moved_sync', {
                cardId,
                sourceColumnId,
                destinationColumnId,
                newPosition
            });
        } catch (error) {
            console.error('Unable to synchronize board card movement:', error.message);
        }
    });

    socket.on('disconnect', () => leaveCurrentBoard(io, socket));
};
