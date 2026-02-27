require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    APP_URL: z.string().default('http://localhost:5000'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    JWT_SECRET: z.string().min(10),
    JWT_ACCESS_TTL: z.coerce.number().default(900),
    JWT_REFRESH_TTL: z.coerce.number().default(604800),
    TWILIO_ACCOUNT_SID: z.string().optional().default(''),
    TWILIO_AUTH_TOKEN: z.string().optional().default(''),
    TWILIO_FROM_NUMBER: z.string().optional().default(''),
    AWS_ACCESS_KEY_ID: z.string().optional().default(''),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
    AWS_REGION: z.string().default('ap-south-1'),
    AWS_S3_BUCKET: z.string().optional().default('sharecare-uploads'),
    AWS_CLOUDFRONT_DOMAIN: z.string().optional().default(''),
    GOOGLE_MAPS_API_KEY: z.string().optional().default(''),
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
    LOGISTICS_PARTNER_API_URL: z.string().optional().default(''),
    LOGISTICS_PARTNER_API_KEY: z.string().optional().default(''),
    LOGISTICS_JWT_SECRET: z.string().min(10),
    DELIVERY_BASE_MARGIN_PERCENT: z.coerce.number().default(20),
    DELIVERY_MINIMUM_MARGIN_INR: z.coerce.number().default(20),
    DEMAND_SPIKE_THRESHOLD_MULTIPLIER: z.coerce.number().default(2.0),
    AI_SUGGESTION_MAX_PER_LOCATION: z.coerce.number().default(3),
});

const env = envSchema.parse(process.env);

module.exports = { env };
