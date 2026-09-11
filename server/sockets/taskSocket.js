const Task = require('../models/taskModel');
const Team = require('../models/teamModel');
const Account = require('../models/accountModel');

const rooms = new Map();

async function canAccessTask(task, userId) {
    if (task.createdBy.toString() === userId) return true;
    if (!task.team) return false;

    const team = await Team.findById(task.team).select('owner members');
    return Boolean(team && (
        team.owner.toString() === userId ||
        team.members.some((member) => member.user.toString() === userId)
    ));
}

function emitPresence(io, taskId) {
    const room = rooms.get(taskId);
    io.to(`task:${taskId}`).emit('task_presence', {
        users: room ? [...room.values()] : []
    });
}

module.exports = (io, socket) => {
    socket.on('join_task', async (taskId, acknowledge) => {
        try {
            const currentTask = await Task.findById(taskId);
            if (!currentTask || !(await canAccessTask(currentTask, socket.user.id))) {
                return acknowledge?.({ error: 'You do not have access to this task' });
            }

            const account = await Account.findById(socket.user.id).select('username');
            const roomName = `task:${taskId}`;
            socket.join(roomName);
            socket.taskId = taskId;

            if (!rooms.has(taskId)) rooms.set(taskId, new Map());
            rooms.get(taskId).set(socket.id, {
                id: socket.user.id,
                username: account?.username || 'Someone',
                editing: false
            });

            acknowledge?.({ ok: true });
            emitPresence(io, taskId);
        } catch (error) {
            acknowledge?.({ error: 'Unable to join task room' });
        }
    });

    socket.on('task_editing', (editing) => {
        const room = rooms.get(socket.taskId);
        const participant = room?.get(socket.id);
        if (!participant) return;

        participant.editing = Boolean(editing);
        socket.to(`task:${socket.taskId}`).emit('task_editing', {
            userId: participant.id,
            username: participant.username,
            editing: participant.editing
        });
        emitPresence(io, socket.taskId);
    });

    socket.on('task_change', (change) => {
        if (!rooms.get(socket.taskId)?.has(socket.id)) return;
        socket.to(`task:${socket.taskId}`).emit('task_change', change);
    });

    socket.on('disconnect', () => {
        if (!socket.taskId) return;
        const room = rooms.get(socket.taskId);
        room?.delete(socket.id);
        if (room?.size === 0) rooms.delete(socket.taskId);
        emitPresence(io, socket.taskId);
    });
};
