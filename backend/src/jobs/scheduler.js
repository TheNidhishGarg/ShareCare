const { queues } = require('../config/bull');

async function setupScheduledJobs() {
    try {
        // Daily demand snapshot at 2 AM
        await queues.demandSnapshot.add(
            'daily-snapshot',
            {},
            {
                repeat: { pattern: '0 2 * * *' }, // cron: 2 AM daily
                removeOnComplete: true,
            }
        );

        // Monthly seasonal suggestions (1st of each month at 3 AM)
        await queues.seasonalSuggestions.add(
            'monthly-seasonal',
            {},
            {
                repeat: { pattern: '0 3 1 * *' },
                removeOnComplete: true,
            }
        );

        // Spike detection every 6 hours
        await queues.spikeDetection.add(
            'spike-check',
            {},
            {
                repeat: { pattern: '0 */6 * * *' },
                removeOnComplete: true,
            }
        );

        // Expire listings hourly
        await queues.expireListings.add(
            'expire-check',
            {},
            {
                repeat: { pattern: '0 * * * *' },
                removeOnComplete: true,
            }
        );

        // Logistics sync every 30 minutes
        await queues.logisticsSync.add(
            'logistics-check',
            {},
            {
                repeat: { pattern: '*/30 * * * *' },
                removeOnComplete: true,
            }
        );

        console.log('✅ Scheduled jobs registered');
    } catch (err) {
        console.warn('⚠️  Failed to register scheduled jobs (Redis required):', err.message);
    }
}

module.exports = { setupScheduledJobs };
