const nodemailer = require('nodemailer');
const { config } = require('../env');
const { logger } = require('./logger');

const {
    BRAND_NAME,
    otpEmailTemplate,
    passwordResetOtpTemplate,
    passwordChangedTemplate,
    welcomeEmailTemplate,
    approvalConfirmedTemplate,
    approvalRejectedTemplate,
    approvalRequestTemplate,
    paymentReminderTemplate
} = require('./emailTemplates');

const validateEmailConfig = () => {
    const required = [
        ['EMAIL_HOST', config.email.host],
        ['EMAIL_PORT', config.email.port],
        ['EMAIL_USER', config.email.user],
        ['EMAIL_PASS', config.email.pass],
        ['EMAIL_FROM', config.email.from],
    ];
    const missing = required
        .filter(([, value]) => value === undefined || value === null || String(value).trim() === '')
        .map(([name]) => name);

    if (missing.length > 0) {
        throw new Error(`Email configuration is incomplete: ${missing.join(', ')}`);
    }
};

validateEmailConfig();

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
        user: config.email.user,
        pass: config.email.pass,
    },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
});

const verifyEmailConnection = () => new Promise((resolve, reject) => {
    transporter.verify((error) => (error ? reject(error) : resolve(true)));
});

const sendEmail = async ({ type, email, subject, html }) => {
    const recipient = String(email || '').trim().toLowerCase();
    const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
    try {
        const result = await transporter.sendMail({
            from: `"${BRAND_NAME}" <${config.email.from}>`,
            to: recipient,
            subject,
            html,
            text,
        });
        logger.info({ emailType: type, recipient, messageId: result.messageId }, 'Email sent');
        return result;
    } catch (error) {
        logger.error({ emailType: type, recipient, err: error?.message, code: error?.code }, 'Email send failed');
        throw error;
    }
};

const sendPaymentReminderEmail = async ({ email, name, amount, duedate }) => {
    await sendEmail({
        type: 'payment-reminder',
        email,
        subject: 'Payment Reminder Email',
        html: paymentReminderTemplate(name, amount, duedate),
    });
    return true;
};

const sendWelcomeEmail = async ({ email, name }) => {
    await sendEmail({
        type: 'welcome',
        email,
        subject: 'Welcome to Aarambh Athletics Hub 🎉',
        html: welcomeEmailTemplate(name),
    });
    return true;
};

const sendOtpEmail = async ({ email, name, otp }) => {
    await sendEmail({
        type: 'otp-verification',
        email,
        subject: 'OTP verification Email',
        html: otpEmailTemplate(name, otp),
    });
    return true;
};

const sendPasswordResetOtpEmail = async ({ email, name, otp }) => {
    await sendEmail({
        type: 'password-reset-otp',
        email,
        subject: 'Your Aarambh Athletics Hub password reset code',
        html: passwordResetOtpTemplate(name, otp),
    });
    return true;
};

const sendPasswordChangedEmail = async ({ email, name }) => {
    await sendEmail({
        type: 'password-changed',
        email,
        subject: 'Your Aarambh Athletics Hub password was changed',
        html: passwordChangedTemplate(name),
    });
    return true;
};

const sendApprovalConfirmedEmail = async ({ email, name, role }) => {
    await sendEmail({
        type: 'approval-confirmed',
        email,
        subject: 'Account approval confirmed by admin 🎉',
        html: approvalConfirmedTemplate(name, role),
    });
    return true;
};

const sendApprovalRejectedEmail = async ({ email, name, role, reason }) => {
    await sendEmail({
        type: 'approval-rejected',
        email,
        subject: 'Account approval update from admin',
        html: approvalRejectedTemplate(name, role, reason),
    });
    return true;
};

const sendApprovalRequestEmail = async ({ email, name, role }) => {
    await sendEmail({
        type: 'approval-request',
        email,
        subject: 'Your application is under review',
        html: approvalRequestTemplate(name, role),
    });
    return true;
};

module.exports = {
    sendApprovalConfirmedEmail,
    sendApprovalRejectedEmail,
    sendApprovalRequestEmail,
    sendWelcomeEmail,
    sendOtpEmail,
    sendPasswordResetOtpEmail,
    sendPasswordChangedEmail,
    sendPaymentReminderEmail,
    verifyEmailConnection,
};