const express = require('express');
const router = express.Router();
const authService = require('../services/auth.service');
const { validate } = require('../middleware/validate');
const { requestOtpSchema, verifyOtpSchema } = require('../validators');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/v1/auth/request-otp
router.post('/request-otp', authLimiter, validate(requestOtpSchema), async (req, res, next) => {
    try {
        const result = await authService.requestOtp(req.validatedBody.phone);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await authService.verifyOtp(
            req.validatedBody.phone,
            req.validatedBody.otp
        );

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            data: { user, accessToken },
            error: null,
            meta: {},
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'No refresh token',
                meta: {},
            });
        }

        const result = await authService.refreshAccessToken(refreshToken);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            data: { accessToken: result.accessToken },
            error: null,
            meta: {},
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        await authService.logout(refreshToken);

        res.clearCookie('refreshToken');
        res.json({ success: true, data: { message: 'Logged out' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
