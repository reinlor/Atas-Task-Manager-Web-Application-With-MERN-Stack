const Card = require('../../models/kanbanModel/cardModel');
const Board = require('../../models/kanbanModel/boardModel');
const { transactionRunService } = require('../../services/transactionRunService');
const { createOrUpdateEmitDashboard } = require('../../services/dashboardService');
const { invalidateUserCaches, deleteKeys } = require('../../services/cacheService');

// Create a new card inside a column
exports.createCard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId, columnId, title, description } = req.body;

        if (!boardId || !columnId || !title) {
            return res.status(400).json({ message: 'boardId, columnId, and title are required' });
        }

        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const targetColumn = board.columns.id(columnId);
        if (!targetColumn) return res.status(404).json({ message: 'Column not found' });

        const position = targetColumn.cards.length;

        const newCard = await transactionRunService(async (session) => {
            const cardDocs = await Card.create([{
                boardId,
                columnId,
                title: title.trim(),
                description: description || '',
                position
            }], { session });

            const createdCard = cardDocs[0];
            targetColumn.cards.push(createdCard._id);
            await board.save({ session });

            await createOrUpdateEmitDashboard({
                userId,
                stats: { inProgress: 1 },
                recentTask: { title: createdCard.title, status: 'In Progress' },
                session
            });

            return createdCard;
        });

        await invalidateUserCaches(userId);
        await deleteKeys(`board:${boardId}`);

        return res.status(201).json(newCard);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to handle Drag-and-Drop Move
exports.moveCard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { cardId, sourceColumnId, destinationColumnId, newPosition } = req.body;

        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        const board = await Board.findById(card.boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const sourceCol = board.columns.id(sourceColumnId);
        const destCol = board.columns.id(destinationColumnId);

        if (!sourceCol || !destCol) {
            return res.status(404).json({ message: 'Source or destination column not found' });
        }

        // Remove card ID from source column
        sourceCol.cards.pull(cardId);

        // Insert card ID into destination column at the exact index
        destCol.cards.splice(newPosition, 0, cardId);

        // Update card's internal column and position reference
        card.columnId = destinationColumnId;
        card.position = newPosition;

        await transactionRunService(async (session) => {
            await card.save({ session });
            await board.save({ session });

            // Detect if moved to "Done" column for dashboard counter updates
            const isDestinationDone = destCol.title.toLowerCase() === 'done';
            const isSourceDone = sourceCol.title.toLowerCase() === 'done';

            if (isDestinationDone && !isSourceDone) {
                await createOrUpdateEmitDashboard({
                    userId,
                    stats: { completed: 1, inProgress: -1 },
                    session
                });
            } else if (!isDestinationDone && isSourceDone) {
                await createOrUpdateEmitDashboard({
                    userId,
                    stats: { completed: -1, inProgress: 1 },
                    session
                });
            }
        });

        await invalidateUserCaches(userId);
        await deleteKeys(`board:${card.boardId}`);

        return res.status(200).json({ message: 'Card moved successfully', card });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to update card title/description/dueDate
exports.updateCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const { title, description, dueDate, assignedTo } = req.body;

        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        if (title !== undefined) card.title = title.trim();
        if (description !== undefined) card.description = description;
        if (dueDate !== undefined) card.dueDate = dueDate;
        if (assignedTo !== undefined) card.assignedTo = assignedTo;

        await card.save();

        await invalidateUserCaches(req.user.id);
        await deleteKeys(`board:${card.boardId}`);

        return res.status(200).json({ message: 'Card updated successfully', card });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to delete a card and clean references from board
exports.deleteCard = async (req, res) => {
    try {
        const { cardId } = req.params;

        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        await transactionRunService(async (session) => {
            await Board.updateOne(
                { _id: card.boardId, 'columns._id': card.columnId },
                { $pull: { 'columns.$.cards': cardId } },
                { session }
            );
            await Card.findByIdAndDelete(cardId, { session });
        });

        await invalidateUserCaches(req.user.id);
        await deleteKeys(`board:${card.boardId}`);

        return res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};