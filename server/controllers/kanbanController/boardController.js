const Board = require('../../models/kanbanModel/boardModel');
const Card = require('../../models/kanbanModel/cardModel');
const Team = require('../../models/teamModel');
const Account = require('../../models/accountModel');
const mongoose = require('mongoose');
const { transactionRunService } = require('../../services/transactionRunService');
const { createOrUpdateEmitDashboard } = require('../../services/dashboardService');
const { createActivityForUsers } = require('../../services/activityService');
const { getJson, setJson, deleteKeys, invalidateUserCaches } = require('../../services/cacheService');

// Controller to get all boards accessible to the user
exports.getBoards = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const cacheKey = `boards:${userId}`;
        const cached = await getJson(cacheKey);
        if (cached) return res.status(200).json(cached);

        const myTeams = await Team.find({
            $or: [{ owner: userId }, { 'members.user': userId }]
        }).select('_id');
        const teamIds = myTeams.map((t) => t._id);

        const boards = await Board.find({
            $or: [{ owner: userId }, { team: {$in: teamIds } }]
        }).populate('columns.cards').sort({ updatedAt: -1 });

        await setJson(cacheKey, boards, 60);
        return res.status(200).json(boards);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to create a new Kanban board with default columns
exports.createBoard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { title, teamId } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Board title is required' });
        }

        const defaultColumns = [
            { title: 'To Do', position: 0, cards: [] },
            { title: 'In Progress', position: 1, cards: [] },
            { title: 'Done', position: 2, cards: [] }
        ];

        const newBoard = await transactionRunService(async (session) => {
            const created = await Board.create([{
                title: title.trim(),
                owner: userId,
                team: teamId || null,
                columns: defaultColumns
            }], { session });

            await createOrUpdateEmitDashboard({
                userId,
                stats: { inProgress: 0, completed: 0 },
                recentTask: { title: created[0].title, status: 'In Progress' },
                recentActivity: { text: `You created board "${created[0].title}"` },
                session
            });

            return created[0];
        });

        await createActivityForUsers({
            userIds: [userId],
            actorId: userId,
            type: 'board_created',
            text: `created board "${newBoard.title}"`
        });

        await invalidateUserCaches(userId);
        return res.status(201).json(newBoard);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to fetch a single board with populated cards
exports.getBoardById = async (req, res) => {
    try {
        const { boardId } = req.params;
        const cacheKey = `board:${boardId}`;
        const cached = await getJson(cacheKey);
        if (cached) return res.status(200).json(cached);

        const board = await Board.findById(boardId).populate('columns.cards');
        if (!board) return res.status(404).json({ message: 'Board not found' });

        await setJson(cacheKey, board, 60);
        return res.status(200).json(board);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to delete a board and all associated cards
exports.deleteBoard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId } = req.params;

        const board = await Board.findOne({ _id: boardId, owner: userId });
        if (!board) return res.status(404).json({ message: 'Board not found or unauthorized' });

        await transactionRunService(async (session) => {
            await Card.deleteMany({ boardId }, { session });
            await Board.findByIdAndDelete(boardId, { session });
        });

        await invalidateUserCaches(userId);
        await deleteKeys(`board:${boardId}`);

        return res.status(200).json({ message: 'Board and all associated cards deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};