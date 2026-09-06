const dashboard = require('../models/dashboardModel');

exports.createOrUpdateEmitDashboard = async ({
    userId,
    stats = {},
    recentTask = {},
    recentActivity = {}
}) => {
    try {
        const { totalTask = 0, inProgress = 0, completed = 0, shared = 0 } = stats;
        const { title, status } = recentTask;
        const { text } = recentActivity;

        const updateOps = {};

        // 1. Increment/Decrement Stats
        if (totalTask || inProgress || completed || shared) {
            updateOps.$inc = {
                'stats.totalTask': totalTask,
                'stats.inProgress': inProgress,
                'stats.completed': completed,
                'stats.shared': shared
            };
        }

        updateOps.$push = {};

        if (title && status) {
            updateOps.$push.recentTask = {
                $each: [{ title, status }],
                $slice: -10
            };
        }

        if (text) {
            updateOps.$push.recentActivity = {
                $each: [{ text, timestamp: new Date() }],
                $slice: -10
            };
        }

        if (Object.keys(updateOps.$push).length === 0) {
            delete updateOps.$push;
        }

        // Execute update/create
        const dash = await dashboard.findOneAndUpdate(
            { userId },
            updateOps,
            { new: true, upsert: true, runValidators: true }
        );

        // Emit socket event if io is available
        // if (dash) {
        //     getIO().to(userId.toString()).emit('dashboard', dash);
        // }

        return dash;
    } catch (error) {
        console.error('Failed to update/emit dashboard:', error);
        throw error; 
    }
};