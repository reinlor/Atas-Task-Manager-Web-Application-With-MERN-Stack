const dashboard = require('../models/dashboardModel');
const { invalidateUserCaches } = require('./cacheService');

exports.createOrUpdateEmitDashboard = async ({
    userId,
    stats = {},
    recentTask = {},
    recentActivity = {},
    session = null
}) => {
    try {
        const { inProgress = 0, completed = 0, shared = 0 } = stats;
        const { title, status } = recentTask;

        // Pipeline Update to transform/update inside a database 🥀
        const pipeline = [
            {
                $set: {
                    "stats.inProgress": { $max: [0, { $add: [{ $ifNull: ["$stats.inProgress", 0] }, inProgress] }] },
                    "stats.completed": { $max: [0, { $add: [{ $ifNull: ["$stats.completed", 0] }, completed] }] },
                    "stats.shared": { $max: [0, { $add: [{ $ifNull: ["$stats.shared", 0] }, shared] }] }
                }
            },
            {
                $set: {
                    // Compute totalTask as the sume of the three
                    "stats.totalTask": {
                        $add: [
                            "$stats.inProgress",
                            "$stats.completed",
                            "$stats.shared"
                        ]
                    }
                }
            }
        ];

        const options = { new: true, upsert: true, runValidators: true, updatePipeline: true, session };

        let dash = await dashboard.findOneAndUpdate({ userId }, pipeline, options);

        // Recent activity is read from Activity; the dashboard stores only counters and task snapshots.
        if (title && status) {
            const pushOps = {};
            pushOps.recentTask = {
                $each: [{ title, status, timestamp: new Date() }],
                $position: 0,
                $slice: 10
            };
            dash = await dashboard.findOneAndUpdate(
                { userId },
                { $push: pushOps },
                { new: true, session }
            );
        }

        await invalidateUserCaches(userId);

        return dash;
    } catch (error) {
        console.error('Failed to update/emit dashboard:', error);
        throw error;
    }
};