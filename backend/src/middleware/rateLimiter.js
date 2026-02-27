const { redis } = require('../config/redis');

function rateLimiter({ windowMs = 60000, max = 100, keyPrefix = 'rl' } = {}) {
    return async (req, res, next) => {
        const key = `${keyPrefix}:${req.ip}`;
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, Math.ceil(windowMs / 1000));
            }
            if (current > max) {
                return res.status(429).json({
                    success: false,
                    data: null,
                    error: 'Too many requests. Please try again later.',
                    meta: { retryAfter: Math.ceil(windowMs / 1000) },
                });
            }
            next();
        } catch (err) {
            // If Redis is down, allow the request through
            next();
        }
    };
}

// Specific limiters
const apiLimiter = rateLimiter({ windowMs: 60000, max: 100, keyPrefix: 'rl:api' });
const authLimiter = rateLimiter({ windowMs: 60000, max: 10, keyPrefix: 'rl:auth' });
const uploadLimiter = rateLimiter({ windowMs: 3600000, max: 20, keyPrefix: 'rl:upload' });

module.exports = { rateLimiter, apiLimiter, authLimiter, uploadLimiter };
