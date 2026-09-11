const Activity = require('../models/activityModel');
const { getJson, setJson } = require('../services/cacheService');

exports.getActivities = async (req, res) => {
    try {
        const cacheKey = `activity:${req.user.id}`;
        const cachedActivities = await getJson(cacheKey);
        if (cachedActivities) return res.status(200).json({ activities: cachedActivities });

        const activities = await Activity.find({ userId: req.user.id })
            .populate('actorId', 'username')
            .sort({ createdAt: -1 })
            .limit(100);

        await setJson(cacheKey, activities, 60);

        return res.status(200).json({ activities });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
