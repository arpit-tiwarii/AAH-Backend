const IORedis = require('ioredis');
const { config } = require('../env');
const { logger } = require('../utils/logger');

// Create a fresh ioredis connection from env configuration.
//
// A full REDIS_URL (e.g. Upstash / Render / Heroku Redis) takes precedence over
// discrete host/port. Previously the queue/worker passed `{ connectionString: url }`,
// which ioredis does not recognise — it silently fell back to 127.0.0.1:6379 and
// never connected to a remote Redis in production. Passing the URL positionally
// (or an options object) is the supported form.
//
// A new client is returned per call on purpose: BullMQ requires a dedicated
// blocking connection for each Queue and Worker, and the rate limiter needs its own.
const createRedisConnection = (overrides = {}) => {
  const options = {
    maxRetriesPerRequest: null, // required by BullMQ; harmless for other consumers
    enableReadyCheck: true,
    ...overrides,
  };

  const client = config.redis.url
    ? new IORedis(config.redis.url, options)
    : new IORedis({ host: config.redis.host, port: config.redis.port, ...options });

  // Without an 'error' listener, ioredis re-emits connection errors as uncaught
  // exceptions and crashes the process on a transient Redis blip.
  client.on('error', (err) => {
    logger.error({ err: err?.message }, 'Redis connection error');
  });

  return client;
};

module.exports = { createRedisConnection };
