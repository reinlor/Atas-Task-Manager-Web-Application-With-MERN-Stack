const task = require('../models/taskModel')
const mongoose = require('mongoose')

// Controller to post raw markdown task to the database
exports.createTask = async (req, res) => {
    try {
        const { title, content, status } = req.body;

        if (!title || !status)
            return res.status(400).json({ message: "Title and status should not be empty" })

        const newTask = await task.create({
            title,
            content,
            status
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
        const { id } = req.params;

        // 1. Check if the provided ID is a valid MongoDB ObjectId
        // if (!mongoose.Types.ObjectId.isValid(id)) {
        //     return res.status(400).json({ message: 'Invalid task ID format' });
        // }

        // 2. Fetch the task
        const myTask = await task.findById(id);

        // 3. Return 404 if task does not exist
        if (!myTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // 4. Return the task
        res.status(200).json(myTask);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};