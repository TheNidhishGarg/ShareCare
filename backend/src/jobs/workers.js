const notificationService = require('../services/notification.service');
const smsService = require('../services/sms.service');
const aiService = require('../services/ai.service');
const { prisma } = require('../config/prisma');
const { createWorker } = require('../config/bull');

function initializeWorkers() {
    // Send OTP worker
    createWorker('send-otp', async (job) => {
        const { phone, otp } = job.data;
        await smsService.sendOtp(phone, otp);
        console.log(`📱 OTP sent to ${phone}`);
    });

    // Send notification worker
    createWorker('send-notification', async (job) => {
        const { userId, type, title, body, data } = job.data;
        await notificationService.create({ userId, type, title, body, data });
        console.log(`🔔 Notification created for user ${userId}: ${title}`);
    });

    // Demand snapshot worker (daily at 2 AM)
    createWorker('demand-snapshot', async () => {
        await aiService.computeDemandSnapshots();
    });

    // Seasonal suggestions worker (monthly 1st)
    createWorker('seasonal-suggestions', async () => {
        await aiService.generateSeasonalSuggestions();
    });

    // Spike detection worker (every 6 hours)
    createWorker('spike-detection', async () => {
        await aiService.detectSpikes();
    });

    // Expire listings worker (hourly)
    createWorker('expire-listings', async () => {
        const result = await prisma.listing.updateMany({
            where: {
                status: 'active',
                expiresAt: { lt: new Date() },
            },
            data: { status: 'expired' },
        });
        if (result.count > 0) {
            console.log(`📦 Expired ${result.count} listings`);
        }
    });

    // Logistics status sync worker (every 30 min)
    createWorker('logistics-sync', async () => {
        // In production, this would poll logistics partner API
        console.log('🚚 Logistics status sync (stub)');
    });

    console.log('✅ Background workers initialized');
}

module.exports = { initializeWorkers };
