const pino = require('pino');
const { config } = require('../env');

// Structured JSON logger. Replaces scattered console.* calls so logs are
// parseable, levelled, and safe (secrets/PII are redacted). In development the
// default pino output is still readable; pipe through `pino-pretty` locally if
// you want colours (`node src/app.js | npx pino-pretty`).
const logger = pino({
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
});

module.exports = { logger };
