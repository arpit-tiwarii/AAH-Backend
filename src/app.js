const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const pinoHttp = require('pino-http');

const { config } = require('./env');
const { logger } = require('./utils/logger');
const { attachRateLimitKey, rateLimiterClient, defaultLimiter } = require('./utils/rateLimit');
const { connectDB, mongoose } = require('./config/db');
const { verifyCloudinaryConnection } = require('./config/cloudinary');
const { routes } = require('./routes/index');
require('./models/index');
const errorHandler = require('./middleware/errorHandler');
const paymentReminderJob = require('./jobs/paymentReminder');

const app = express();
const PORT = config.app.port;
const isProduction = config.isProduction;
const allowedOrigins = config.app.frontendUrls;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProduction && /^http:\/\/localhost:(5173|3000|4173)($|\/)/.test(origin)) {
    return true;
  }
  return false;
};

// Trust the first proxy hop (Render / Nginx / a load balancer) so client IPs —
// which the rate limiters key on — are read from X-Forwarded-For instead of
// collapsing to the proxy's address.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction ? undefined : false,
  noSniff: true,
  xFrameOptions: { action: 'deny' },
  hsts: isProduction,
}));

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.options(/^(.*)$/, cors(corsOptions));
app.use(cors(corsOptions));
app.use(attachRateLimitKey);

// Structured request logging with a per-request id. Health checks are noisy and
// omitted from the access log.
app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === '/health' },
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Liveness/readiness endpoint for load balancers, Docker HEALTHCHECK and uptime
// monitors. Reports DB connectivity; unauthenticated and never rate limited.
app.get('/health', (req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { mongo: mongoUp ? 'up' : 'down' },
  });
});

app.use('/api', defaultLimiter, routes);

// JSON 404 for anything unmatched, so API clients never receive Express's
// default HTML error page.
app.use((req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'The requested resource was not found.' });
});

app.use(errorHandler);

// --- Non-fatal readiness checks -------------------------------------------------
// These verify external dependencies at boot but must NOT prevent the server from
// starting: email is queued and retried, Cloudinary is only needed for uploads,
// and Redis reconnects on its own. A transient blip in any of them should degrade
// a feature, not take the whole API offline. MongoDB is the exception (below).

const verifyEmailConnection = () => new Promise((resolve, reject) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  transporter.verify((error) => (error ? reject(error) : resolve(true)));
});

const verifyRedisConnection = () => new Promise((resolve, reject) => {
  const net = require('net');
  const socket = net.createConnection({ host: config.redis.host, port: config.redis.port });
  socket.on('connect', () => { socket.end(); resolve(true); });
  socket.on('error', reject);
});

const runReadinessChecks = async () => {
  const checks = [
    ['cloudinary', verifyCloudinaryConnection],
    ['email', verifyEmailConnection],
    ['redis', verifyRedisConnection],
  ];
  const results = await Promise.allSettled(checks.map(([, fn]) => fn()));
  results.forEach((result, i) => {
    const [name] = checks[i];
    if (result.status === 'fulfilled') {
      logger.info({ dependency: name }, 'Dependency check passed');
    } else {
      logger.warn({ dependency: name, err: result.reason?.message }, 'Dependency check failed — starting anyway');
    }
  });
};

let server;

const gracefulShutdown = (signal) => {
  logger.info({ signal }, 'Shutting down API server');
  const forceExit = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  const close = async () => {
    try {
      if (server) await new Promise((res) => server.close(res));
      await mongoose.connection.close(false);
      await rateLimiterClient.quit();
    } catch (err) {
      logger.error({ err: err?.message }, 'Error during shutdown');
    } finally {
      clearTimeout(forceExit);
      process.exit(0);
    }
  };
  close();
};

const start = async () => {
  await connectDB(); // fatal: the app cannot function without the database
  await runReadinessChecks();
  paymentReminderJob();

  server = app.listen(PORT, () => {
    logger.info({ port: PORT, env: config.nodeEnv }, 'Server running');
  });
};

start().catch((err) => {
  logger.fatal({ err: err?.message }, 'Failed to start server');
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason?.message || reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err: err?.message, stack: err?.stack }, 'Uncaught exception');
  gracefulShutdown('uncaughtException');
});

module.exports = app;
