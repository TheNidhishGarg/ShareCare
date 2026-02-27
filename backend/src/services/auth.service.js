const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { env } = require('../config/env');
const { prisma } = require('../config/prisma');
const { redis } = require('../config/redis');
const { queues } = require('../config/bull');
const { AppError } = require('../middleware/errorHandler');

class AuthService {
    // Generate a 6-digit OTP
    generateOtp() {
        return crypto.randomInt(100000, 999999).toString();
    }

    // Check OTP rate limit
    async checkOtpRateLimit(phone) {
        const key = `otp_rate:${phone}`;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, 600); // 10 min window
        }
        if (count > 3) {
            throw new AppError('Too many OTP requests. Try again in 10 minutes.', 429);
        }
    }

    // Check OTP lockout
    async checkOtpLockout(phone) {
        const lockKey = `otp_lock:${phone}`;
        const locked = await redis.get(lockKey);
        if (locked) {
            throw new AppError('Account temporarily locked. Try again in 30 minutes.', 429);
        }
    }

    // Request OTP
    async requestOtp(phone) {
        await this.checkOtpLockout(phone);
        await this.checkOtpRateLimit(phone);

        const otp = this.generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        // Store OTP log
        await prisma.otpLog.create({
            data: {
                phone,
                otpHash,
                purpose: 'auth',
                expiresAt,
            },
        });

        // Queue SMS sending (in dev, log to console)
        if (env.TWILIO_ACCOUNT_SID) {
            await queues.sendOtp.add('send-otp', { phone, otp });
        } else {
            console.log(`📱 [DEV] OTP for ${phone}: ${otp}`);
        }

        return { message: 'OTP sent successfully', expiresAt };
    }

    // Verify OTP
    async verifyOtp(phone, otp) {
        await this.checkOtpLockout(phone);

        // Find latest unused OTP for this phone
        const otpLog = await prisma.otpLog.findFirst({
            where: {
                phone,
                purpose: 'auth',
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpLog) {
            // Increment failure counter
            const failKey = `otp_fail:${phone}`;
            const failures = await redis.incr(failKey);
            if (failures === 1) await redis.expire(failKey, 1800);
            if (failures >= 5) {
                await redis.setex(`otp_lock:${phone}`, 1800, '1');
                throw new AppError('Too many failed attempts. Locked for 30 minutes.', 429);
            }
            throw new AppError('Invalid or expired OTP', 400);
        }

        const isValid = await bcrypt.compare(otp, otpLog.otpHash);
        if (!isValid) {
            const failKey = `otp_fail:${phone}`;
            const failures = await redis.incr(failKey);
            if (failures === 1) await redis.expire(failKey, 1800);
            if (failures >= 5) {
                await redis.setex(`otp_lock:${phone}`, 1800, '1');
                throw new AppError('Too many failed attempts. Locked for 30 minutes.', 429);
            }
            throw new AppError('Invalid OTP', 400);
        }

        // Mark OTP as used
        await prisma.otpLog.update({
            where: { id: otpLog.id },
            data: { isUsed: true, usedAt: new Date() },
        });

        // Clear failure counter
        await redis.del(`otp_fail:${phone}`);

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
            user = await prisma.user.create({
                data: { phone, isVerified: true },
            });
        } else if (!user.isVerified) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            });
        }

        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user.id);

        return { user, accessToken, refreshToken };
    }

    // Generate access token (15 min)
    generateAccessToken(user) {
        return jwt.sign(
            { userId: user.id, role: user.role || 'user' },
            env.JWT_SECRET,
            { expiresIn: env.JWT_ACCESS_TTL }
        );
    }

    // Generate refresh token (7 days, stored in Redis)
    async generateRefreshToken(userId) {
        const token = crypto.randomUUID();
        await redis.setex(`refresh:${token}`, env.JWT_REFRESH_TTL, userId);
        return token;
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        const userId = await redis.get(`refresh:${refreshToken}`);
        if (!userId) {
            throw new AppError('Invalid refresh token', 401);
        }

        // Delete old refresh token (rotation)
        await redis.del(`refresh:${refreshToken}`);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new AppError('User not found or deactivated', 401);
        }

        const accessToken = this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(userId);

        return { accessToken, refreshToken: newRefreshToken };
    }

    // Logout
    async logout(refreshToken) {
        if (refreshToken) {
            await redis.del(`refresh:${refreshToken}`);
        }
    }
}

module.exports = new AuthService();
