const dashboard = require('../models/dashboardModel')
const task = require('../models/taskModel')
const Team = require('../models/teamModel')
const Activity = require('../models/activityModel')
const { getJson, setJson } = require('../services/cacheService');

exports.getDashboardByID = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const cacheKey = `dashboard:${userId}`;
        const cachedDashboard = await getJson(cacheKey);
        if (cachedDashboard) return res.status(200).json(cachedDashboard);

        const dashboardData = await dashboard.findOne({ userId });
        const cachedActivities = await getJson(`activity:${userId}`);
        const recentActivity = cachedActivities
            ? cachedActivities.slice(0, 5)
            : await Activity.find({ userId })
                .populate('actorId', 'username')
                .sort({ createdAt: -1 })
                .limit(100);

        const myTeams = await Team.find({
            $or: [{ owner: userId }, { 'members.user': userId }]
        }).select('_id');
        const myTeamIds = myTeams.map((t) => t._id);

        const taskData = await task.find({
            $or: [{ createdBy: userId }, { team: { $in: myTeamIds } }]
        })
            .sort({ update: -1, created: -1 })
            .limit(5);

        if (!dashboardData) {
            const response = {
                dashboardData: {
                    stats: { totalTask: 0, inProgress: 0, completed: 0, shared: 0 },
                    recentTask: [],
                    recentActivity
                },
                taskData
            };
            await setJson(cacheKey, response, 60);
            return res.status(200).json(response);
        }

        const response = {
            dashboardData: {
                ...dashboardData.toObject(),
                recentActivity
            },
            taskData
        };
        await setJson(cacheKey, response, 60);
        return res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}