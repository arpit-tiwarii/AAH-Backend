const pino = require('pino');
const { config } = require('../env');

// Structured JSON is retained in production for Render and log aggregation.
// Development uses pino-pretty so local logs are readable without a pipeline.
const loggerOptions = {
  level: process.env.LOG_LEVEL || (config.isProduction ? 'info' : 'debug'),
  base: { service: 'aarambh-athletics-hub-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
      'otp',
      '*.otp',
      'aadhar',
      '*.aadhar',
    ],
    remove: true,
  },
};

if (!config.isProduction) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service',
      singleLine: true,
      hideObject: true,
    },
  };
}

const logger = pino(loggerOptions);

module.exports = { logger };
