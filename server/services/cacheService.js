const redisClient = require('../config/redis');

exports.getJson = async (key) => {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
};

exports.setJson = async (key, value, seconds = 60) => {
    await redisClient.set(key, JSON.stringify(value), { EX: seconds });
};

exports.deleteKeys = async (...keys) => {
    const validKeys = keys.flat().filter((key) => typeof key === 'string' && key.length > 0);
    if (validKeys.length === 0) return 0;

    return redisClient.del(validKeys);
};

exports.deleteByPattern = async (pattern) => {
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        await exports.deleteKeys(key);
    }
};

exports.invalidateUserCaches = async (userId) => {
    const id = userId.toString();
    await Promise.all([
        exports.deleteByPattern(`tasks:${id}:*`),
        exports.deleteKeys(
            `dashboard:${id}`,
            `activity:${id}`,
            `notifications:${id}`
        )
    ]);
};

exports.invalidateTaskCaches = async (taskId) => {
    await exports.deleteByPattern(`task:${taskId}:*`);
};
