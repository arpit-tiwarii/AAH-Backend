const { Worker } = require('bullmq');
const { createRedisConnection } = require('../config/redis');
const { logger } = require('../utils/logger');
const {
    sendWelcomeEmail,
    sendOtpEmail,
    sendPasswordResetOtpEmail,
    sendPasswordChangedEmail,
    sendApprovalConfirmedEmail,
    sendApprovalRejectedEmail,
    sendApprovalRequestEmail,
    sendPaymentReminderEmail,
} = require('../utils/email.service.js');

const handlers = {
    'welcome-email': sendWelcomeEmail,
    'otp-email': sendOtpEmail,
    'password-reset-otp-email': sendPasswordResetOtpEmail,
    'password-changed-email': sendPasswordChangedEmail,
    'approval-confirm-email': sendApprovalConfirmedEmail,
    'approval-reject-email': sendApprovalRejectedEmail,
    'approval-request-email': sendApprovalRequestEmail,
    'payment-reminder-email': sendPaymentReminderEmail,
};

const connection = createRedisConnection();

const worker = new Worker(
    'email-queue',
    async (job) => {
        const handler = handlers[job.name];
        if (!handler) {
            logger.warn({ job: job.name }, 'No handler registered for email job');
            return;
        }
        await handler(job.data);
    },
    {
        connection,
        concurrency: Number(process.env.EMAIL_WORKER_CONCURRENCY) || 5,
    }
);

worker.on('completed', (job) => {
    logger.info({ job: job.name, id: job.id }, 'Email job completed');
});
worker.on('failed', (job, err) => {
    logger.error({ job: job?.name, id: job?.id, attempts: job?.attemptsMade, err: err?.message }, 'Email job failed');
});
worker.on('error', (err) => {
    logger.error({ err: err?.message }, 'Email worker error');
});

logger.info('Email worker started');

const shutdown = async (signal) => {
    logger.info({ signal }, 'Email worker shutting down');
    try {
        await worker.close();
        await connection.quit();
    } catch (err) {
        logger.error({ err: err?.message }, 'Error during worker shutdown');
    } finally {
        process.exit(0);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { worker };
