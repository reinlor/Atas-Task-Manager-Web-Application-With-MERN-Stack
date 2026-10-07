const Board = require('../../models/kanbanModel/boardModel');
const Card = require('../../models/kanbanModel/cardModel');
const Team = require('../../models/teamModel');
const { transactionRunService } = require('../../services/transactionRunService');
const { createOrUpdateEmitDashboard } = require('../../services/dashboardService');
const { createActivityForUsers } = require('../../services/activityService');
const { getJson, setJson } = require('../../services/cacheService');
const { getBoardAccess, getBoardParticipantIds, invalidateBoardState } = require('../../services/kanbanAccessService');

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

// Controller to create a new empty Kanban board
exports.createBoard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { title, teamId } = req.body;

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'Board title is required' });
        }

        if (teamId && !(await Team.exists({ _id: teamId, owner: userId }))) {
            return res.status(403).json({ message: 'Only a team owner can share a board with that team' });
        }

        const newBoard = await transactionRunService(async (session) => {
            const created = await Board.create([{
                title: title.trim(),
                owner: userId,
                team: teamId || null,
                columns: []
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
            userIds: await getBoardParticipantIds(newBoard),
            actorId: userId,
            type: 'board_created',
            text: `created board "${newBoard.title}"`
        });

        await invalidateBoardState(newBoard);
        return res.status(201).json(newBoard);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to fetch a single board with populated cards
exports.getBoardById = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { id: userId } = req.user;
        const cacheKey = `board:${boardId}`;

        const access = await getBoardAccess(boardId, userId);
        if (!access.board) return res.status(404).json({ message: 'Board not found' });
        if (!access.canView) {
            return res.status(403).json({ message: 'You do not have access to this board' });
        }

        const cached = await getJson(cacheKey);
        if (cached) return res.status(200).json(cached);
        const board = await Board.findById(boardId).populate('columns.cards');
        await setJson(cacheKey, board, 60);
        return res.status(200).json(board);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateBoard = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId } = req.params;
        const { title, teamId } = req.body;
        const board = await Board.findOne({ _id: boardId, owner: userId });
        if (!board) return res.status(404).json({ message: 'Board not found or unauthorized' });
        const previousTeamId = board.team;

        if (title !== undefined) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({ message: 'Board title is required' });
            }
            board.title = title.trim();
        }

        let newTeamId = board.team;
        if (teamId !== undefined) {
            if (teamId && !(await Team.exists({ _id: teamId, owner: userId }))) {
                return res.status(403).json({ message: 'Only a team owner can share a board with that team' });
            }
            board.team = teamId || null;
            newTeamId = board.team;
        }

        await board.save();
        await invalidateBoardState({ ...board.toObject(), team: previousTeamId }, newTeamId);
        const oldBoardParticipants = await getBoardParticipantIds({
            ...board.toObject(),
            team: previousTeamId
        });
        const newBoardParticipants = await getBoardParticipantIds(board);
        await createActivityForUsers({
            userIds: [...new Set([...oldBoardParticipants, ...newBoardParticipants])],
            actorId: userId,
            type: 'board_updated',
            text: `updated board "${board.title}"${teamId !== undefined ? ' sharing' : ''}`
        });
        return res.status(200).json({ message: 'Board updated successfully', board });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addColumn = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId } = req.params;
        const { title } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'Column title is required' });
        }

        const access = await getBoardAccess(boardId, userId);
        const { board } = access;
        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });
        if (board.columns.length >= 6) {
            return res.status(400).json({ message: 'A board cannot have more than 6 columns' });
        }

        board.columns.push({
            title: title.trim(),
            position: board.columns.length,
            cards: []
        });
        await board.save();
        await invalidateBoardState(board);
        await createActivityForUsers({
            userIds: await getBoardParticipantIds(board),
            actorId: userId,
            type: 'board_column_added',
            text: `added column "${title.trim()}" to board "${board.title}"`
        });
        return res.status(201).json({ message: 'Column created successfully', column: board.columns.at(-1) });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.renameColumn = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { boardId, columnId } = req.params;
        const { title } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: 'Column title is required' });
        }

        const access = await getBoardAccess(boardId, userId);
        const { board } = access;
        if (!board) return res.status(404).json({ message: 'Board not found' });
        if (!access.canEdit) return res.status(403).json({ message: 'You do not have permission to edit this board' });

        const column = board.columns.id(columnId);
        if (!column) return res.status(404).json({ message: 'Column not found' });
        const previousTitle = column.title;
        column.title = title.trim();
        await board.save();
        await invalidateBoardState(board);
        await createActivityForUsers({
            userIds: await getBoardParticipantIds(board),
            actorId: userId,
            type: 'board_column_renamed',
            text: `renamed column "${previousTitle}" to "${column.title}" on board "${board.title}"`
        });
        return res.status(200).json({ message: 'Column renamed successfully', column });
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

        await invalidateBoardState(board);

        return res.status(200).json({ message: 'Board and all associated cards deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};