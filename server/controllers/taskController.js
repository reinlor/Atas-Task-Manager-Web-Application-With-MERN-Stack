const task = require('../models/taskModel');
const Team = require('../models/teamModel');
const Account = require('../models/accountModel');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const { transactionRunService } = require('../services/transactionRunService')

// services
const { createAndEmitNotification } = require('../services/notificationService');
const { createOrUpdateEmitDashboard } = require('../services/dashboardService');

const truncate = (str, maxLength = 20) => {
    if (!str) return '';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

// Controller to post raw markdown task to the database
exports.createTask = async (req, res) => {

    const { id } = req.user;
    const { title, content, status } = req.body;
    const taskCacheKey = `task:${id}`

    if (!title || !status)
        return res.status(400).json({ message: "Title and status should not be empty" })

    try {
        const newTask = await transactionRunService(async (session) => {

            const created = await task.create([{
                title,
                content,
                status,
                createdBy: req.user.id,
            }], { session })
            const createdTask = created[0]

            await createOrUpdateEmitDashboard({
                userId: id,
                stats: {
                    inProgress: status === 'In Progress' || status === 'Pending' ? 1 : 0,
                    completed: status === 'Complete' ? 1 : 0
                },
                recentTask: { title: createdTask.title, status: createdTask.status },
                recentActivity: { text: `You created "${createdTask.title}"` },
                session
            });
            return createdTask;
        })
        await redisClient.del(taskCacheKey)

        return res.status(201).json({
            _id: newTask._id,
            title: newTask.title,
            status: newTask.status
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ message: "Server Error", error: error.message })
    }
}

async function resolveTaskPermissions(taskDoc, userId) {
    const isOwner = taskDoc.createdBy.toString() === userId;
    if (isOwner) return { isOwner: true, canEdit: true, hasAccess: true };

    if (!taskDoc.team) {
        return { isOwner: false, canEdit: false, hasAccess: false };
    }

    const team = await Team.findById(taskDoc.team);
    if (!team) return { isOwner: false, canEdit: false, hasAccess: false };

    const isTeamOwner = team.owner.toString() === userId;
    const membership = team.members.find((m) => m.user.toString() === userId);

    if (!isTeamOwner && !membership) {
        return { isOwner: false, canEdit: false, hasAccess: false };
    }

    const canEdit = isTeamOwner || membership?.role === 'Editor';
    return { isOwner: false, canEdit, hasAccess: true };
}

async function notifyAndUpdateDashboards(recipientIds, { type, text }) {
    for (const recipientId of recipientIds) {
        try {
            await createAndEmitNotification({ userId: recipientId, type, text });
        } catch (err) {
            console.error(`Failed to notify ${recipientId}:`, err.message);
        }
        try {
            await createOrUpdateEmitDashboard({
                userId: recipientId,
                stats: { shared: type === 'share' ? 1 : 0 },
                recentActivity: { text }
            });
        } catch (err) {
            console.error(`Failed to update dashboard for ${recipientId}:`, err.message);
        }
    }
}

// Controller to update raw markdown task to the database
exports.updateTask = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { id: taskId } = req.params;
        const updates = req.body;
 
        const currentTask = await task.findById(taskId);
        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
 
        const { isOwner, canEdit } = await resolveTaskPermissions(currentTask, userId);
        if (!canEdit) {
            return res.status(403).json({ message: 'You do not have permission to edit this task' });
        }
 
        if (!isOwner && Object.prototype.hasOwnProperty.call(updates, 'team')) {
            return res.status(403).json({ message: 'Only the task creator can change sharing' });
        }
 
        const initialTeamId = currentTask.team ? currentTask.team.toString() : null;
 
        Object.assign(currentTask, updates);
        const updatedTask = await currentTask.save();
 
        const newTeamId = updatedTask.team ? updatedTask.team.toString() : null;
 
        if (newTeamId) {
            const actor = await Account.findById(userId).select('username');
            const actorName = truncate(actor?.username || 'Someone', 15);
            const taskTitle = truncate(updatedTask.title, 20);
 
            if (!initialTeamId) {
                // Scenario 1: task was newly shared with a team
                const teamDoc = await Team.findById(newTeamId);
                if (teamDoc) {
                    const recipients = new Set();
 
                    if (teamDoc.owner.toString() !== userId.toString()) {
                        recipients.add(teamDoc.owner.toString());
                    }
                    teamDoc.members.forEach((m) => {
                        const memberId = m.user.toString();
                        if (memberId !== userId.toString()) recipients.add(memberId);
                    });
 
                    await notifyAndUpdateDashboards(recipients, {
                        type: 'share',
                        text: `${actorName} shared "${taskTitle}" with you`
                    });
                }
            } else {
                // Scenario 2: general update to an already-shared task
                const teamDoc = await Team.findById(newTeamId);
                if (teamDoc) {
                    const recipients = new Set();
 
                    if (updatedTask.createdBy.toString() !== userId.toString()) {
                        recipients.add(updatedTask.createdBy.toString());
                    }
                    if (teamDoc.owner.toString() !== userId.toString()) {
                        recipients.add(teamDoc.owner.toString());
                    }
                    teamDoc.members.forEach((m) => {
                        const memberId = m.user.toString();
                        if (memberId !== userId.toString()) recipients.add(memberId);
                    });
 
                    await notifyAndUpdateDashboards(recipients, {
                        type: 'update',
                        text: `${actorName} updated "${taskTitle}"`
                    });
                }
            }
        }
 
        await redisClient.del(`task:${userId}`);
        await redisClient.del(`tasklist:${taskId}`);
 
        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTask
        });
 
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to get raw markdown from the database
exports.getTask = async (req, res) => {
    try {
        const { id } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        const cacheKey = `task:${id}`
        const cachedTask = await redisClient.get(cacheKey)
        if (cachedTask) {
            console.log('Retrieve using cache');
            return res.status(200).json(
                JSON.parse(cachedTask)
            )
        }

        const myTeams = await Team.find({
            $or: [{ owner: id }, { 'members.user': id }]
        }).select('_id');
        const myTeamIds = myTeams.map((t) => t._id);

        const myTask = await task.find({
            $or: [
                { createdBy: id },
                { team: { $in: myTeamIds } }
            ]
        });

        if (!myTask || myTask.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await redisClient.set(cacheKey, JSON.stringify(myTask), { EX: 60 })

        console.log('retrieve directly from database')
        res.status(200).json(myTask);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to get individual task by id
exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.user;
        const pageId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        if (!mongoose.Types.ObjectId.isValid(pageId)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        const cacheKey = `tasklist:${pageId}`
        const cachedTask = await redisClient.get(cacheKey)
        if (cachedTask) {
            console.log('Retrieve using cache');
            return res.status(200).json(
                JSON.parse(cachedTask)
            )
        }

        const myTask = await task.findById(pageId);

        if (!myTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { isOwner, canEdit, hasAccess } = await resolveTaskPermissions(myTask, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'You do not have access to this task' });
        }

        const responseBody = { ...myTask.toObject(), isOwner, canEdit };

        await redisClient.set(cacheKey, JSON.stringify(responseBody), { EX: 60 })

        console.log('retrieve directly from database')
        res.status(200).json(responseBody);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Controller to delete a task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.user
        const docId = req.params.id

        const taskCacheKey = `task:${id}`
        const taskListCacheKey = `tasklist:${id}`

        console.log(`id: ${id}, docId: ${docId}`)
        const deletedItem = await task.findOneAndDelete({ _id: docId, createdBy: id })

        if (!deletedItem) {
            return res.status(404).json({ message: "Task not found", data: deletedItem })
        }

        // TODO: Add Dashboard service for decrementation

        await redisClient.del(taskCacheKey)
        await redisClient.del(taskListCacheKey)

        return res.status(200).json({ message: "Task Deleted Successfully" })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}   