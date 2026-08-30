const cron = require('node-cron')
const { emailQueue } = require('../queues/email.queue');
const { findPendingPayments } = require('../repositories/Fee.repository');



const paymentReminderJob = () => {
    const task = cron.schedule('0 9 * * *', async () => {
        try {
            const pendingPayments = await findPendingPayments()
            if (Array.isArray(pendingPayments) && pendingPayments.length > 0) {
                for (const payment of pendingPayments) {
                    const email = payment?.user?.email;
                    if (!email) continue;

                    await emailQueue.add(
                        'payment-reminder-email',
                        {
                            email,
                            name: payment?.user?.name,
                            amount: payment?.amount,
                            duedate: payment?.month && payment?.year
                                ? `${payment.month} ${payment.year}`
                                : 'at your earliest convenience',
                        },
                        {
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 2000
                            },
                            removeOnComplete: true
                        }
                    )
                }
            }
        } catch (err) {
            console.error('Payment reminder job failed', err?.message)
        }
    }, {
        timezone: 'Asia/Kolkata',
    })
    return task
}

module.exports = paymentReminderJob
