const redisClient = require('../config/redis');

exports.getJson = async (key) => {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
};

exports.setJson = async (key, value, seconds = 60) => {
    await redisClient.set(key, JSON.stringify(value), { EX: seconds });
};

exports.deleteByPattern = async (pattern) => {
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        await redisClient.del(key);
    }
};

exports.invalidateUserCaches = async (userId) => {
    const id = userId.toString();
    await Promise.all([
        exports.deleteByPattern(`tasks:${id}:*`),
        redisClient.del(`dashboard:${id}`),
        redisClient.del(`activity:${id}`),
        redisClient.del(`notifications:${id}`)
    ]);
};

exports.invalidateTaskCaches = async (taskId) => {
    await exports.deleteByPattern(`task:${taskId}:*`);
};
