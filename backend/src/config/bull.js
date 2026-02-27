const { Queue, Worker } = require('bullmq');
const { env } = require('./env');

const connection = {
    host: new URL(env.REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

// Queue definitions
const queues = {
    sendOtp: new Queue('send-otp', { connection }),
    sendNotification: new Queue('send-notification', { connection }),
    demandSnapshot: new Queue('demand-snapshot', { connection }),
    seasonalSuggestions: new Queue('seasonal-suggestions', { connection }),
    spikeDetection: new Queue('spike-detection', { connection }),
    expireListings: new Queue('expire-listings', { connection }),
    logisticsSync: new Queue('logistics-sync', { connection }),
};

function createWorker(name, processor) {
    return new Worker(name, processor, {
        connection,
        concurrency: 5,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
    });
}

module.exports = { queues, createWorker, connection };
