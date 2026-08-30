const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { config } = require('../env');
const { createRedisConnection } = require('../config/redis');
const { logger } = require('./logger');

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0 && forwardedFor[0]) {
    return forwardedFor[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const getRateLimitKey = (req) => {
  const authHeader = req.headers.authorization;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      const userId = decoded?.id ?? decoded?.userId ?? decoded?._id;

      if (userId) {
        return `user:${String(userId)}`;
      }
    } catch (error) {
      logger.warn(
        { err: error?.message, path: req.originalUrl },
        'Invalid token while generating rate-limit key; falling back to IP',
      );
    }
  }

  return `ip:${getClientIp(req)}`;
};

const attachRateLimitKey = (req, res, next) => {
  req.rateLimitKey = getRateLimitKey(req);
  next();
};

const isProduction = config.isProduction;
const rateLimiterClient = createRedisConnection();
const makeRedisStore = (prefix) => new RedisStore({
  prefix,
  sendCommand: (...args) => rateLimiterClient.call(...args),
});

const createLimiter = ({ prefix, windowMs, max, message }) => rateLimit({
  windowMs,
  max,
  keyGenerator: (req) => req.rateLimitKey || getRateLimitKey(req),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore(prefix),
  message,
});

const defaultLimiter = createLimiter({
  prefix: 'rl:default:',
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
});

const authLimiter = createLimiter({
  prefix: 'rl:auth:',
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 25,
  message: { code: 'AUTH_RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts, please try again later.' },
});

const otpLimiter = createLimiter({
  prefix: 'rl:otp:',
  windowMs: 10 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: { code: 'OTP_RATE_LIMIT_EXCEEDED', message: 'Too many OTP requests, please try again later.' },
});

const forgotPasswordLimiter = createLimiter({
  prefix: 'rl:forgot-pw:',
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: { code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED', message: 'Too many password reset requests, please try again later.' },
});

const resetPasswordLimiter = createLimiter({
  prefix: 'rl:reset-pw:',
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 40,
  message: { code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED', message: 'Too many password reset attempts, please try again later.' },
});

module.exports = {
  getClientIp,
  getRateLimitKey,
  attachRateLimitKey,
  rateLimiterClient,
  defaultLimiter,
  authLimiter,
  otpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  createLimiter,
};
