const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const toNumber = (value, fallback, min, max) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (typeof min === 'number' && parsed < min) {
    return fallback;
  }
  if (typeof max === 'number' && parsed > max) {
    return fallback;
  }
  return parsed;
};

const parseList = (value) => (value || '')
  .split(',')
  .map((entry) => String(entry).trim())
  .filter(Boolean);

const nodeEnv = (process.env.NODE_ENV || process.env.NODE_TYPE || 'development').toLowerCase();
const frontendUrls = parseList(process.env.FRONTEND_URL || 'http://localhost:5173');

const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  app: Object.freeze({
    nodeEnv,
    port: toNumber(process.env.PORT, 8000, 1, 65535),
    frontendUrls,
    frontendUrl: frontendUrls[0] || 'http://localhost:5173',
  }),
  database: Object.freeze({
    mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  }),
  auth: Object.freeze({
    jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || '',
    jwtExpiresIn: process.env.JWT_EXPIRE_IN || '1h',
    passwordSaltRounds: toNumber(process.env.SALT_ROUND, 10, 4, 15),
  }),
  email: Object.freeze({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: toNumber(process.env.EMAIL_PORT || process.env.SMTP_PORT, 587, 1, 65535),
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || '',
  }),
  storage: Object.freeze({
    cloudinary: Object.freeze({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    }),
  }),
  redis: Object.freeze({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: toNumber(process.env.REDIS_PORT, 6379, 1, 65535),
    url: process.env.REDIS_URL || '',
  }),
});

const requiredConfig = [
  ['NODE_ENV', nodeEnv, ['development', 'test', 'production']],
  ['PORT', config.app.port, (value) => Number.isInteger(value) && value > 0],
  ['MONGODB_URI', config.database.mongoUri, (value) => typeof value === 'string' && value.trim().length > 0],
  ['JWT_SECRET', config.auth.jwtSecret, (value) => typeof value === 'string' && value.trim().length >= 32],
  ['FRONTEND_URL', frontendUrls, (value) => Array.isArray(value) && value.length > 0],
  ['EMAIL_HOST', config.email.host, (value) => typeof value === 'string' && value.trim().length > 0],
  ['EMAIL_PORT', config.email.port, (value) => Number.isInteger(value) && value > 0],
  ['EMAIL_USER', config.email.user, (value) => typeof value === 'string' && value.trim().length > 0],
  ['EMAIL_PASS', config.email.pass, (value) => typeof value === 'string' && value.trim().length > 0],
  ['CLOUDINARY_CLOUD_NAME', config.storage.cloudinary.cloudName, (value) => typeof value === 'string' && value.trim().length > 0],
  ['CLOUDINARY_API_KEY', config.storage.cloudinary.apiKey, (value) => typeof value === 'string' && value.trim().length > 0],
  ['CLOUDINARY_API_SECRET', config.storage.cloudinary.apiSecret, (value) => typeof value === 'string' && value.trim().length > 0],
  ['REDIS_HOST', config.redis.host, (value) => typeof value === 'string' && value.trim().length > 0],
  ['REDIS_PORT', config.redis.port, (value) => Number.isInteger(value) && value > 0],
];

const missingOrInvalid = requiredConfig
  .filter(([, value, validator]) => {
    if (Array.isArray(validator)) {
      return !validator.includes(value);
    }
    return !validator(value);
  })
  .map(([key]) => key);

if (missingOrInvalid.length > 0) {
  const details = missingOrInvalid.join(', ');
  throw new Error(`Missing or invalid required environment variables: ${details}. Review backend/.env.example and set the required values before starting the server.`);
}

module.exports = { config };
