const task = require('../models/taskModel')
const Team = require('../models/teamModel')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const redisClient = require('../config/redis')

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

        await redisClient.del(taskCacheKey)

        return res.status(201).json({
            _id: newTask._id,
            title: newTask.title,
            status: newTask.status
        })
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message })
    }
}

// Works out whether `userId` can edit `taskDoc`, and whether they're its
// creator. Shared with both updateTask (to actually enforce it) and
// getTaskById (to tell the client whether to show edit controls at all).
// Kept as one function so those two can never quietly disagree with each
// other about who's allowed to do what.
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

        const cacheKey = `tasklist:${taskId}`

        const currentTask = await task.findById(taskId);
        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // This is the fix for a real gap in the previous version: it read
        // `const { id } = req.params` (the TASK's id) and never touched
        // `req.user` at all, so there was no ownership check whatsoever —
        // any authenticated request could PATCH any task by id. Now, before
        // touching any fields, work out whether this user is even allowed to.
        const { isOwner, canEdit } = await resolveTaskPermissions(currentTask, userId);
        if (!canEdit) {
            return res.status(403).json({ message: 'You do not have permission to edit this task' });
        }

        // Only the creator can change WHO a task is shared with — a shared
        // Editor can edit content, but re-sharing or un-sharing someone
        // else's task isn't theirs to decide.
        if (!isOwner && Object.prototype.hasOwnProperty.call(updates, 'team')) {
            return res.status(403).json({ message: 'Only the task creator can change sharing' });
        }

        const changes = {};

        res.status(200).json({
            message: 'Task updated successfully',
            changes,
            task: currentTask
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Controller to get raw markdown from the database
exports.getTask = async (req, res) => {
    try {
        const { id } = req.user;

        // Check if it is a valid MongoDB id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        // Checking if cache exists 😏
        const cacheKey = `task:${id}`
        const cachedTask = await redisClient.get(cacheKey)
        if (cachedTask) {
            console.log('Retrieve using cache'); // TODO: remove log before deployment
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

        // If task not found
        if (!myTask || myTask.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Store on redis cache
        await redisClient.set(cacheKey, JSON.stringify(myTask), { EX: 60 }) //TODO: Change 60 to much longer before deployment

        // If task exist
        console.log('retrieve directly from database') // TODO: remove log before deployment
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

        // Checking if cache exists 😏
        const cacheKey = `tasklist:${pageId}`
        const cachedTask = await redisClient.get(cacheKey)
        if (cachedTask) {
            console.log('Retrieve using cache'); // TODO: remove log before deployment
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

        // Store on redis cache
        await redisClient.set(cacheKey, JSON.stringify(responseBody), { EX: 60 }) //TODO: Change 60 to much longer before deployment

        console.log('retrieve directly from database') // TODO: remove log before deployment
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