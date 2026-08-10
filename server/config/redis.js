const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Redis Connection
(async () => {
  await redisClient.connect();
  console.log('⚡ Connected to Redis successfully');
})();

module.exports = redisClient;