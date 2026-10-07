const Card = require('../../models/kanbanModel/cardModel');
const Board = require('../../models/kanbanModel/boardModel');
const { transactionRunService } = require('../../services/transactionRunService');
const { createOrUpdateEmitDashboard } = require('../../services/dashboardService');
const { createActivityForUsers } = require('../../services/activityService');
const { getBoardAccess, getBoardParticipantIds, invalidateBoardState } = require('../../services/kanbanAccessService');

// Create a new card inside a column
exports.createCard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId, columnId, title, description } = req.body;

        if (
            !boardId ||
            !columnId ||
            typeof title !== 'string' ||
            !title.trim()
        ) {
            return res.status(400).json({ message: 'boardId, columnId, and title are required' });
        }

        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });
        const access = await getBoardAccess(boardId, userId);
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });

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

        await invalidateBoardState(board);
        await createActivityForUsers({
            userIds: await getBoardParticipantIds(board),
            actorId: userId,
            type: 'board_card_added',
            text: `added card "${newCard.title}" to board "${board.title}"`
        });

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
        const access = await getBoardAccess(board._id, userId);
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });

        const sourceCol = board.columns.id(sourceColumnId);
        const destCol = board.columns.id(destinationColumnId);

        if (!sourceCol || !destCol) {
            return res.status(404).json({ message: 'Source or destination column not found' });
        }
        if (card.columnId.toString() !== sourceColumnId) {
            return res.status(409).json({ message: 'Card is no longer in the source column' });
        }
        if (!Number.isInteger(newPosition) || newPosition < 0 || newPosition > destCol.cards.length) {
            return res.status(400).json({ message: 'Invalid card position' });
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

        await invalidateBoardState(board);
        await createActivityForUsers({
            userIds: await getBoardParticipantIds(board),
            actorId: userId,
            type: 'board_card_moved',
            text: `moved card "${card.title}" on board "${board.title}"`
        });

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
        const board = await Board.findById(card.boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });
        const access = await getBoardAccess(board._id, req.user.id);
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });
        if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
            return res.status(400).json({ message: 'Card title cannot be empty' });
        }

        const hasChanged =
            (title !== undefined && card.title !== title.trim()) ||
            (description !== undefined && card.description !== description) ||
            (dueDate !== undefined && String(card.dueDate) !== String(dueDate)) ||
            (assignedTo !== undefined &&
                JSON.stringify(card.assignedTo.map((id) => id.toString())) !==
                JSON.stringify(assignedTo));
        if (title !== undefined) card.title = title.trim();
        if (description !== undefined) card.description = description;
        if (dueDate !== undefined) card.dueDate = dueDate;
        if (assignedTo !== undefined) card.assignedTo = assignedTo;

        await card.save();

        if (hasChanged) {
            await invalidateBoardState(board);
            await createActivityForUsers({
                userIds: await getBoardParticipantIds(board),
                actorId: req.user.id,
                type: 'board_updated',
                text: `updated card "${card.title}" on board "${board.title}"`
            });
        }

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
        const board = await Board.findById(card.boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });
        const access = await getBoardAccess(board._id, req.user.id);
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });

        await transactionRunService(async (session) => {
            await Board.updateOne(
                { _id: card.boardId, 'columns._id': card.columnId },
                { $pull: { 'columns.$.cards': cardId } },
                { session }
            );
            await Card.findByIdAndDelete(cardId, { session });
        });

        await invalidateBoardState(board);
        await createActivityForUsers({
            userIds: await getBoardParticipantIds(board),
            actorId: req.user.id,
            type: 'board_updated',
            text: `deleted card "${card.title}" from board "${board.title}"`
        });

        return res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};