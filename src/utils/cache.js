const { rateLimiterClient } = require('./rateLimit');
const { logger } = require('./logger');

const getCache = async (key) => {
    try {
        const value = await rateLimiterClient.get(`cache:${key}`);
        return value === null ? null : JSON.parse(value);
    } catch (error) {
        logger.warn({ err: error?.message, key }, 'Redis cache read failed');
        return null;
    }
};

const setCache = async (key, value, ttlSeconds) => {
    try {
        await rateLimiterClient.set(
            `cache:${key}`,
            JSON.stringify(value),
            'EX',
            ttlSeconds
        );
    } catch (error) {
        logger.warn({ err: error?.message, key }, 'Redis cache write failed');
    }
};

const deleteCache = async (key) => {
    try {
        await rateLimiterClient.del(`cache:${key}`);
    } catch (error) {
        logger.warn({ err: error?.message, key }, 'Redis cache invalidation failed');
    }
};

module.exports = { getCache, setCache, deleteCache };
