const task = require('../models/taskModel')
const Team = require('../models/teamModel')
const Account = require('../models/accountModel')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const redisClient = require('../config/redis')

// services
const { createAndEmitNotification } = require('../services/notificationService');
const { createOrUpdateEmitDashboard } = require('../services/dashboardService');

const truncate = (str, maxLength = 20) => {
    if (!str) return '';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

// Controller to post raw markdown task to the database
exports.createTask = async (req, res) => {
    try {
        const { id } = req.user;
        const { title, content, status } = req.body;
        const taskCacheKey = `task:${id}`

        if (!title || !status)
            return res.status(400).json({ message: "Title and status should not be empty" })

        const newTask = await task.create({
            title,
            content,
            status,
            createdBy: req.user.id
        })

        // FIXME: Update core logic of createOrUpdateEmitDashboard
        await createOrUpdateEmitDashboard(
            {   
                userId: id,
                stats: {
                    userId: id,
                    totalTask: 1,
                    inProgress: 1
                },
                recentTask: {
                    title: title,
                    status: status
                },
                recentActivity: {
                    text: `You created "${title}"`
                }
            }
        )
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

        // Apply updates and save
        Object.assign(currentTask, updates);
        const updatedTask = await currentTask.save();

        const newTeamId = updatedTask.team ? updatedTask.team.toString() : null;

        // Check if team exist
        if (newTeamId) {
            const actor = await Account.findById(userId).select('username');
            const actorName = truncate(actor?.username || 'Someone', 15);
            const taskTitle = truncate(updatedTask.title, 20);

            // task was newly shared with a Team
            if (!initialTeamId) {
                const teamDoc = await Team.findById(newTeamId);
                if (teamDoc) {
                    const recipients = new Set();

                    if (teamDoc.owner.toString() !== userId.toString()) {
                        recipients.add(teamDoc.owner.toString());
                    }

                    teamDoc.members.forEach((m) => {
                        const memberId = m.user.toString();
                        if (memberId !== userId.toString()) {
                            recipients.add(memberId);
                        }
                    });

                    for (const recipientId of recipients) {
                        await createAndEmitNotification({
                            userId: recipientId,
                            type: 'share',
                            text: `${actorName} shared "${taskTitle}" with you`
                        });
                    }
                }
            }

            // General Task Update
            else {
                const teamDoc = await Team.findById(newTeamId);
                if (teamDoc) {
                    const recipients = new Set();

                    // Add task creator if they didn't make the edit
                    if (updatedTask.createdBy.toString() !== userId.toString()) {
                        recipients.add(updatedTask.createdBy.toString());
                    }

                    // Add team owner if they didn't make the edit
                    if (teamDoc.owner.toString() !== userId.toString()) {
                        recipients.add(teamDoc.owner.toString());
                    }

                    // Add team members except the editor
                    teamDoc.members.forEach((m) => {
                        const memberId = m.user.toString();
                        if (memberId !== userId.toString()) {
                            recipients.add(memberId);
                        }
                    });

                    for (const recipientId of recipients) {
                        await createAndEmitNotification({
                            userId: recipientId,
                            type: 'update',
                            text: `${actorName} updated "${taskTitle}"`
                        });
                    }
                }
            }
        }

        // Clear Redis caches
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

        await redisClient.del(taskCacheKey)
        await redisClient.del(taskListCacheKey)

        return res.status(200).json({ message: "Task Deleted Successfully" })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}   