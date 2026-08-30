const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

// A dedicated Redis connection for the queue. Honors REDIS_URL when set
// (see config/redis.js) — the previous `{ connectionString }` form was ignored
// by ioredis and always connected to localhost.
const emailQueue = new Queue('email-queue', {
    connection: createRedisConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
});

module.exports = { emailQueue };
