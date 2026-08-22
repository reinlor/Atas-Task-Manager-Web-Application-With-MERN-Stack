const task = require('../models/taskModel')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const redisClient = require('../config/redis')

// Controller to post raw markdown task to the database
exports.createTask = async (req, res) => {
    try {
        const { title, content, status } = req.body;

        if (!title || !status)
            return res.status(400).json({ message: "Title and status should not be empty" })

        const newTask = await task.create({
            title,
            content,
            status,
            createdBy: req.user.id
        })

        return res.status(201).json({
            _id: newTask._id,
            title: newTask.title,
            status: newTask.status
        })
    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message })
    }
}

// Controller to update raw markdown task to the database
exports.updateTask = async (req, res) => {
    try {
        const updates = req.body;
        const { id } = req.params;

        const cacheKey = `tasklist:${id}`

        const currentTask = await task.findById(id);
        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const changes = {};

        // Loop over the keys provided in updates
        for (const key in updates) {
            // Optional: Skip inherited properties
            if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;

            // Convert values to String for reliable comparison (handles ObjectIDs, Dates, etc.)
            const oldValue = currentTask[key];
            const newValue = updates[key];

            const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

            if (hasChanged) {
                changes[key] = {
                    old: oldValue,
                    new: newValue
                };
                currentTask[key] = newValue;
            }
        }

        // Check if any fields were actually updated
        if (Object.keys(changes).length === 0) {
            return res.status(200).json({
                message: 'No changes detected',
                task: currentTask
            });
        }

        // SAVE the updated task to MongoDB!
        await currentTask.save();
        
        await redisClient.del(cacheKey)

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
        const cacheKey = `task: ${id}`
        const cachedTask = await redisClient.get(cacheKey)
        if (cachedTask){
            console.log('Retrieve using cache'); // TODO: remove log before deployment
            return res.status(200).json(
                JSON.parse(cachedTask)
            )
        }

        const myTask = await task.find({ createdBy: id });

        // If task not found
        if (!myTask || myTask.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Store on redis cache
        await redisClient.set(cacheKey, JSON.stringify(myTask), {EX: 60}) //TODO: Change 60 to much longer before deployment

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
        if (cachedTask){
            console.log('Retrieve using cache'); // TODO: remove log before deployment
            return res.status(200).json(
                JSON.parse(cachedTask)
            )
        }

        const myTask = await task.findOne({ createdBy: id, _id: pageId });

        if (!myTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Store on redis cache
        await redisClient.set(cacheKey, JSON.stringify(myTask), {EX: 60}) //TODO: Change 60 to much longer before deployment
        
        console.log('retrieve directly from database') // TODO: remove log before deployment
        res.status(200).json(myTask);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}