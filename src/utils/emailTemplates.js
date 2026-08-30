const fs = require('fs');
const path = require('path');

const BRAND_NAME = 'Aarambh Athletics Hub';
const BRAND_TAGLINE = 'Train • Compete • Achieve';
const LOGO_PATH = path.resolve(__dirname, '../../../frontend/src/assets/logo.png');

let logoDataUri = '';
try {
    const logoBuffer = fs.readFileSync(LOGO_PATH);
    logoDataUri = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (error) {
    console.warn('Aarambh logo not found at frontend/src/assets/logo.png; continuing without embedded logo.');
}

const getEmailTemplate = (title, content) => `
<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="margin:0;padding:0;background:#f4f7fc;font-family:Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                <td align="center" style="padding:30px;">
                    <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#fff;border-radius:12px;overflow:hidden;">

                        <tr>
                            <td align="center" style="background:#0f172a;color:white;padding:25px 25px 18px;">
                                ${logoDataUri ? `<img src="${logoDataUri}" alt="${BRAND_NAME}" width="120" height="120" style="display:block;border-radius:50%;margin:0 auto 12px;background:#fff;padding:8px;" />` : '<div style="font-size:28px;font-weight:700;letter-spacing:1px;margin-bottom:8px;">Aarambh</div>'}
                                <div style="font-size:28px;font-weight:700;letter-spacing:1px;">${BRAND_NAME}</div>
                                <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#dbeafe;margin-top:8px;">${BRAND_TAGLINE}</div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:30px;">
                                <h2>${title}</h2>
                                ${content}
                            </td>
                        </tr>

                        <tr>
                            <td align="center"
                            style="background:#f8fafc;padding:20px;color:#64748b;">
                            © ${new Date().getFullYear()} ${BRAND_NAME}
                            </td>
                        </tr>

                    </table>
                </td>
                </tr>
            </table>
        </body>
    </html>
`;

const paymentReminderTemplate = (name, amount, dueDate) =>
    getEmailTemplate(
        "Payment Reminder 💳",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>This is a reminder that your payment is still pending.</p>

        <div style="
            background:#fff7ed;
            border-left:5px solid #f59e0b;
            padding:15px;
            margin:20px 0;
        ">
            <p><strong>Amount Due:</strong> ₹${amount}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>

        <p>Please log in to your Aarambh Athletics Hub account and complete the payment at your earliest convenience.</p>

        <p>If payment has already been made, please disregard this email.</p>
        `
    );

const otpEmailTemplate = (name, otp) =>
    getEmailTemplate(
        "Verify Your Account 🔐",
        `
        <p>Hi <strong>${name}</strong>,</p>
        <p>Please use the OTP below to verify your account.</p>

        <div style="
            background:#eff6ff;
            border:2px dashed #2563eb;
            padding:20px;
            text-align:center;
            margin:20px 0;
            font-size:32px;
            font-weight:bold;
            color:#2563eb;
        ">
            ${otp}
        </div>

        <p>This OTP is valid for 10 minutes.</p>
        `
    );

const welcomeEmailTemplate = (name) =>
    getEmailTemplate(
        "Welcome to Aarambh Athletics Hub 🎉",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>Your registration has been completed successfully.</p>

        <div style="
            background:#fff7ed;
            border-left:5px solid #f59e0b;
            padding:15px;
            margin:20px 0;
        ">
            <strong>Profile Status:</strong> Under Review ⏳
        </div>

        <p>Our administrators are reviewing your profile.</p>
        <p>You will receive another email once your account has been approved.</p>
        `
    );

const approvalConfirmedTemplate = (name, role) =>
    getEmailTemplate(
        "Application Approved ✅",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>Your profile has been approved.</p>

        <div style="
            background:#ecfdf5;
            border-left:5px solid #22c55e;
            padding:15px;
            margin:20px 0;
        ">
            Approved Role: <strong>${role}</strong>
        </div>

        <p>You can now log in and access Aarambh Athletics Hub.</p>
        `
    );

const approvalRejectedTemplate = (name, role, reason = "Wrong documentation") =>
    getEmailTemplate(
        "Application Rejected ❌",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>Your request for <strong>${role}</strong> could not be approved.</p>

        ${reason
            ? `
                <div style="
                    background:#fef2f2;
                    border-left:5px solid #ef4444;
                    padding:15px;
                    margin:20px 0;
                ">
                    ${reason}
                </div>
                `
            : ""
        }

        <p>You may update your information and apply again.</p>
        `
    );

const approvalRequestTemplate = (name, role) =>
    getEmailTemplate(
        "Approval Request Received ⏳",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>We have successfully received your request for the role of <strong>${role}</strong>.</p>

        <div style="
            background:#fff7ed;
            border-left:5px solid #f97316;
            padding:15px;
            margin:20px 0;
        ">
            Your application is currently under review.
        </div>

        <p>Our team will verify the submitted information and notify you once a decision has been made.</p>

        <p>Thank you for your patience.</p>
        `
    );


const passwordResetOtpTemplate = (name, otp) =>
    getEmailTemplate(
        "Reset Your Password 🔑",
        `
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your Aarambh Athletics Hub password. Use the code below to continue.</p>

        <div style="
            background:#eff6ff;
            border:2px dashed #2563eb;
            padding:20px;
            text-align:center;
            margin:20px 0;
            font-size:32px;
            font-weight:bold;
            letter-spacing:4px;
            color:#2563eb;
        ">
            ${otp}
        </div>

        <p>This code is valid for 10 minutes and can be used once.</p>

        <div style="
            background:#fef2f2;
            border-left:5px solid #ef4444;
            padding:15px;
            margin:20px 0;
        ">
            If you did not request a password reset, you can safely ignore this
            email — your password has not been changed. Never share this code
            with anyone.
        </div>
        `
    );

const passwordChangedTemplate = (name) =>
    getEmailTemplate(
        "Your Password Was Changed 🔒",
        `
        <p>Hi <strong>${name}</strong>,</p>

        <p>Your Aarambh Athletics Hub password was just changed successfully. You have been signed out on all devices and can now log in with your new password.</p>

        <div style="
            background:#fef2f2;
            border-left:5px solid #ef4444;
            padding:15px;
            margin:20px 0;
        ">
            If you did not make this change, reset your password immediately and
            contact our support team.
        </div>
        `
    );


module.exports = {
    BRAND_NAME,
    otpEmailTemplate,
    passwordResetOtpTemplate,
    passwordChangedTemplate,
    welcomeEmailTemplate,
    approvalConfirmedTemplate,
    approvalRejectedTemplate,
    approvalRequestTemplate,
    paymentReminderTemplate
};