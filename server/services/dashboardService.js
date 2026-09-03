const dashboard = require('../models/dashboardModel');

// FIXME: Update core logic of createOrUpdateEmitDashboard
exports.createOrUpdateEmitDashboard = async ({ userId, stats, recentTask, recentActivity }) => {
    try {
        const payload = {
            stats: {
                totalTask: stats?.inProgress + stats?.completed + stats?.shared,
                inProgress: stats?.inProgress,
                completed: stats?.completed,
                shared: stats?.shared
            },
            recentTask: [{
                title: recentTask?.title,
                status: recentTask?.status,
                time: recentTask?.time
            }],
            recentActivity: [{
                text: recentActivity?.text,
                time: recentActivity?.time
            }],
            userId: userId
        }

        // Create or Update (if it already exist 😏) a dasboard document
        const dash = await dashboard.findOneAndUpdate(
            { userId: userId },
            payload,
            { new: true, upsert: true })
            .populate({ path: 'Account', select: 'name email' });

        // Emit a socket
        getIO().to(userId.toString()).emit('dashboard', dash);

        return dash
    }
    catch (error) {
        console.error('Failed to retrieve dashboard:', error);
    }
}