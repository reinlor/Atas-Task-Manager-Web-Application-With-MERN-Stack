const Board = require('../models/kanbanModel/boardModel');
const Team = require('../models/teamModel');
const { invalidateUserCaches, deleteKeys } = require('./cacheService');

exports.getBoardAccess = async (boardId, userId) => {
    const board = await Board.findById(boardId);
    if (!board) return { board: null, canView: false, canEdit: false, isOwner: false };

    const isOwner = board.owner.toString() === userId.toString();
    if (!board.team) {
        return { board, canView: isOwner, canEdit: isOwner, isOwner };
    }

    const team = await Team.findById(board.team).select('owner members');
    const isTeamOwner = Boolean(team && team.owner.toString() === userId.toString());
    const membership = team?.members.find(
        (member) => member.user.toString() === userId.toString()
    );
    const canView = isOwner || isTeamOwner || Boolean(membership);
    const canEdit = isOwner || isTeamOwner || membership?.role === 'Editor';

    return { board, canView, canEdit, isOwner };
};

exports.getBoardParticipantIds = async (board) => {
    const userIds = new Set([board.owner.toString()]);
    if (!board.team) return [...userIds];

    const team = await Team.findById(board.team).select('owner members.user');
    if (team) {
        userIds.add(team.owner.toString());
        team.members.forEach((member) => userIds.add(member.user.toString()));
    }
    return [...userIds];
};

exports.invalidateBoardState = async (board, additionalTeamId) => {
    const teamIds = [...new Set(
        [board.team, additionalTeamId]
            .filter(Boolean)
            .map((teamId) => teamId.toString())
    )];
    const teams = teamIds.length
        ? await Team.find({ _id: { $in: teamIds } }).select('owner members.user')
        : [];
    const userIds = new Set([board.owner.toString()]);

    for (const team of teams) {
        userIds.add(team.owner.toString());
        team.members.forEach((member) => userIds.add(member.user.toString()));
    }

    await Promise.all([...userIds].map((userId) => invalidateUserCaches(userId)));
    await deleteKeys(`board:${board._id}`);
};
