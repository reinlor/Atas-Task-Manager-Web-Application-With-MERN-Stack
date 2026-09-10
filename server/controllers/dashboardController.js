const dashboard = require('../models/dashboardModel')
const task = require('../models/taskModel')
const Team = require('../models/teamModel')

exports.getDashboardByID = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const dashboardData = await dashboard.findOne({ userId });

        const myTeams = await Team.find({
            $or: [{ owner: userId }, { 'members.user': userId }]
        }).select('_id');
        const myTeamIds = myTeams.map((t) => t._id);

        const taskData = await task.find({
            $or: [{ createdBy: userId }, { team: { $in: myTeamIds } }]
        })
            .sort({ created: -1 })
            .limit(5);

        if (!dashboardData) {
            return res.status(200).json({
                dashboardData: {
                    stats: { totalTask: 0, inProgress: 0, completed: 0, shared: 0 },
                    recentTask: [],
                    recentActivity: []
                },
                taskData
            });
        }

        return res.status(200).json({ dashboardData, taskData })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}