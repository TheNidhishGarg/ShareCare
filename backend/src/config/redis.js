const Redis = require('ioredis');
const { env } = require('./env');

let redis;

try {
    redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
            if (times > 3) {
                console.warn('⚠️  Redis connection failed after 3 retries — running without Redis');
                return null;
            }
            return Math.min(times * 200, 2000);
        },
    });

    redis.on('error', (err) => {
        console.warn('⚠️  Redis error:', err.message);
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected');
    });
} catch (err) {
    console.warn('⚠️  Redis unavailable — running without cache');
    // Create a mock redis object for graceful degradation
    redis = {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 0,
        incr: async () => 1,
        expire: async () => 1,
        ttl: async () => -1,
        exists: async () => 0,
        setex: async () => 'OK',
    };
}

module.exports = { redis };
