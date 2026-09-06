const cron = require('node-cron')
const { sendPaymentReminderEmail } = require('../utils/email.service');
const { logger } = require('../utils/logger');
const { findPendingPayments } = require('../repositories/Fee.repository');



const paymentReminderJob = () => {
    const task = cron.schedule('0 9 * * *', async () => {
        try {
            const pendingPayments = await findPendingPayments()
            if (Array.isArray(pendingPayments) && pendingPayments.length > 0) {
                for (const payment of pendingPayments) {
                    const email = payment?.user?.email;
                    if (!email) continue;

                    try {
                        await sendPaymentReminderEmail({
                            email,
                            name: payment?.user?.name,
                            amount: payment?.amount,
                            duedate: payment?.month && payment?.year
                                ? `${payment.month} ${payment.year}`
                                : 'at your earliest convenience',
                        });
                    } catch (emailError) {
                        logger.error(
                            { err: emailError?.message, recipient: email, emailType: 'payment-reminder' },
                            'Payment reminder email failed'
                        );
                    }
                }
            }
        } catch (err) {
            logger.error({ err: err?.message }, 'Payment reminder job failed')
        }
    }, {
        timezone: 'Asia/Kolkata',
    })
    return task
}

module.exports = paymentReminderJob
