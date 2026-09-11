const Activity = require('../models/activityModel');
const { invalidateUserCaches } = require('./cacheService');

exports.createActivity = async ({ userId, actorId, type, text }) => {
    try {
        const activity = await Activity.create({ userId, actorId, type, text });
        await invalidateUserCaches(userId);
        return activity;
    } catch (error) {
        console.error('Failed to create activity:', error.message);
        return null;
    }
};

exports.createActivityForUsers = async ({ userIds, actorId, type, text }) => {
    await Promise.all([...new Set(userIds.map((userId) => userId.toString()))].map((userId) =>
        exports.createActivity({ userId, actorId, type, text })
    ));
};
