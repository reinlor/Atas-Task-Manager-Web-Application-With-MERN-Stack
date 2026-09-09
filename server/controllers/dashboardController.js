const dashboard = require('../models/dashboardModel')
const task = require('../models/taskModel')

exports.getDashboardByID = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const dashboardData = await dashboard.findOne({ userId });
        const taskData = await task.findOne({ userId }).limit(5);

        if (!dashboardData || !taskData) {
            return res.status(404).json({ message: 'Dashboard data not found' })
        }

        return res.status(200).json({ dashboardData, taskData })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}   