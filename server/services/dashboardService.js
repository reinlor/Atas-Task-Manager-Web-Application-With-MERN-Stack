const dashboard = require('../models/dashboardModel');

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
        const { text } = recentActivity;

        // Pipeline Update to transform/update inside a database 🥀
        const pipeline = [
            {
                $set: {
                    "stats.inProgress": { $add: [{ $ifNull: ["$stats.inProgress", 0] }, inProgress] },
                    "stats.completed": { $add: [{ $ifNull: ["$stats.completed", 0] }, completed] },
                    "stats.shared": { $add: [{ $ifNull: ["$stats.shared", 0] }, shared] }
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

        // for pushing recentTask and recentActivity if it exist
        if ((title && status) || text) {
            const pushOps = {};
            if (title && status) {
                pushOps.recentTask = {
                    $each: [{ title, status, timestamp: new Date() }],
                    $position: 0,
                    $slice: 10
                };
            }
            if (text) {
                pushOps.recentActivity = {
                    $each: [{ text, timestamp: new Date() }],
                    $position: 0,
                    $slice: 10
                };
            }
 
            dash = await dashboard.findOneAndUpdate(
                { userId },
                { $push: pushOps },
                { new: true, session }
            );
        }

        return dash;
    } catch (error) {
        console.error('Failed to update/emit dashboard:', error);
        throw error;
    }
};