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
const { createActivityForUsers } = require('../services/activityService');
const { getJson, setJson, invalidateUserCaches, invalidateTaskCaches } = require('../services/cacheService');

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
        await createActivityForUsers({
            userIds: [id],
            actorId: id,
            type: 'task_created',
            text: `created "${newTask.title}"`
        });
        await invalidateUserCaches(id)
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
                stats: { shared: 0 },
                recentActivity: { text }
            });
        } catch (err) {
            console.error(`Failed to update dashboard for ${recipientId}:`, err.message);
        }
    }
}

async function getSharedUserIds(teamId, creatorId) {
    const teamDoc = await Team.findById(teamId).select('owner members');
    if (!teamDoc) return [];

    const userIds = new Set([
        teamDoc.owner.toString(),
        ...teamDoc.members.map((member) => member.user.toString())
    ]);
    userIds.delete(creatorId.toString());
    return [...userIds];
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
        const initialStatus = currentTask.status;
 
        Object.assign(currentTask, updates);
        const updatedTask = await currentTask.save();
        const actor = await Account.findById(userId).select('username');
        const actorName = truncate(actor?.username || 'Someone', 15);
        const taskTitle = truncate(updatedTask.title, 20);

        if (initialStatus !== updatedTask.status) {
            await createOrUpdateEmitDashboard({
                userId: updatedTask.createdBy,
                stats: {
                    inProgress: (updatedTask.status === 'Pending' || updatedTask.status === 'In Progress' ? 1 : 0)
                        - (initialStatus === 'Pending' || initialStatus === 'In Progress' ? 1 : 0),
                    completed: (updatedTask.status === 'Complete' ? 1 : 0)
                        - (initialStatus === 'Complete' ? 1 : 0)
                }
            });
        }
 
        const newTeamId = updatedTask.team ? updatedTask.team.toString() : null;
        const affectedUserIds = new Set([userId, updatedTask.createdBy.toString()]);

        if (initialTeamId !== newTeamId) {
            const previousRecipients = initialTeamId
                ? await getSharedUserIds(initialTeamId, updatedTask.createdBy)
                : [];
            const nextRecipients = newTeamId
                ? await getSharedUserIds(newTeamId, updatedTask.createdBy)
                : [];

            previousRecipients.forEach((recipientId) => affectedUserIds.add(recipientId));
            nextRecipients.forEach((recipientId) => affectedUserIds.add(recipientId));

            await Promise.all(previousRecipients.map((recipientId) =>
                createOrUpdateEmitDashboard({ userId: recipientId, stats: { shared: -1 } })
            ));
            await Promise.all(nextRecipients.map((recipientId) =>
                createOrUpdateEmitDashboard({ userId: recipientId, stats: { shared: 1 } })
            ));

            await createActivityForUsers({
                userIds: [userId, ...previousRecipients, ...nextRecipients],
                actorId: userId,
                type: newTeamId ? 'task_shared' : 'task_unshared',
                text: newTeamId
                    ? `shared "${taskTitle}" with a team`
                    : `stopped sharing "${taskTitle}"`
            });
        } else {
            const recipients = newTeamId ? await getSharedUserIds(newTeamId, updatedTask.createdBy) : [];
            recipients.forEach((recipientId) => affectedUserIds.add(recipientId));
            await createActivityForUsers({
                userIds: [updatedTask.createdBy, ...recipients],
                actorId: userId,
                type: initialStatus !== updatedTask.status ? 'task_completed' : 'task_updated',
                text: `updated "${taskTitle}"`
            });
        }
 
        if (newTeamId) {
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
        await Promise.all([...affectedUserIds].map((affectedUserId) => invalidateUserCaches(affectedUserId)));
        await invalidateTaskCaches(taskId);
 
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

        const statusParam = (req.query.status || 'all').toLowerCase();
        const sortParam = (req.query.sort || 'latest').toLowerCase();
        const scopeParam = (req.query.scope || 'all').toLowerCase();
        const validStatuses = { pending: 'Pending', 'in progress': 'In Progress', complete: 'Complete' };
        const status = validStatuses[statusParam];
        const sort = sortParam === 'oldest' ? { update: 1, created: 1 } : { update: -1, created: -1 };
        const cacheKey = `tasks:${id}:${statusParam}:${sortParam}:${scopeParam}`;
        const cachedTasks = await getJson(cacheKey);
        if (cachedTasks) return res.status(200).json(cachedTasks);

        if (statusParam !== 'all' && !status) {
            return res.status(400).json({ message: 'Invalid status filter' });
        }
        if (!['all', 'latest', 'oldest'].includes(sortParam)) {
            return res.status(400).json({ message: 'Invalid sort option' });
        }
        if (!['all', 'shared', 'local'].includes(scopeParam)) {
            return res.status(400).json({ message: 'Invalid task scope' });
        }

        const myTeams = await Team.find({
            $or: [{ owner: id }, { 'members.user': id }]
        }).select('_id');
        const myTeamIds = myTeams.map((t) => t._id);

        const visibility = scopeParam === 'local'
            ? { createdBy: id, team: null }
            : scopeParam === 'shared'
                ? { team: { $in: myTeamIds } }
                : { $or: [{ createdBy: id }, { team: { $in: myTeamIds } }] };
        const filter = status ? { ...visibility, status } : visibility;
        const myTask = await task.find(filter).sort(sort);

        await setJson(cacheKey, myTask, 60);

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

        const cacheKey = `task:${pageId}:${id}`;
        const cachedTask = await getJson(cacheKey)
        if (cachedTask) return res.status(200).json(cachedTask);

        const myTask = await task.findById(pageId);

        if (!myTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { isOwner, canEdit, hasAccess } = await resolveTaskPermissions(myTask, id);
        if (!hasAccess) {
            return res.status(403).json({ message: 'You do not have access to this task' });
        }

        const responseBody = { ...myTask.toObject(), isOwner, canEdit };

        await setJson(cacheKey, responseBody, 60)

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

        console.log(`id: ${id}, docId: ${docId}`)
        const deletedItem = await task.findOneAndDelete({ _id: docId, createdBy: id })

        if (!deletedItem) {
            return res.status(404).json({ message: "Task not found", data: deletedItem })
        }

        const statusStats = {
            inProgress: deletedItem.status === 'Pending' || deletedItem.status === 'In Progress' ? -1 : 0,
            completed: deletedItem.status === 'Complete' ? -1 : 0
        };
        await createOrUpdateEmitDashboard({ userId: deletedItem.createdBy, stats: statusStats });

        if (deletedItem.team) {
            const teamDoc = await Team.findById(deletedItem.team).select('owner members');
            if (teamDoc) {
                const recipientIds = new Set([
                    teamDoc.owner.toString(),
                    ...teamDoc.members.map((member) => member.user.toString())
                ]);
                recipientIds.delete(deletedItem.createdBy.toString());

                for (const recipientId of recipientIds) {
                    await createOrUpdateEmitDashboard({
                        userId: recipientId,
                        stats: { shared: -1 }
                    });
                }
            }
        }

        const deletedRecipients = deletedItem.team
            ? await getSharedUserIds(deletedItem.team, deletedItem.createdBy)
            : [];
        await createActivityForUsers({
            userIds: [deletedItem.createdBy, ...deletedRecipients],
            actorId: id,
            type: 'task_deleted',
            text: `deleted "${deletedItem.title}"`
        });

        await invalidateUserCaches(id)
        await invalidateTaskCaches(docId)

        return res.status(200).json({ message: "Task Deleted Successfully" })
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}   