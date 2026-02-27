const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { prisma } = require('../config/prisma');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            data: null,
            error: 'Missing or invalid authorization header',
            meta: {},
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role || 'user';
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                data: null,
                error: 'Token expired',
                meta: { code: 'TOKEN_EXPIRED' },
            });
        }
        return res.status(401).json({
            success: false,
            data: null,
            error: 'Invalid token',
            meta: {},
        });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role || 'user';
    } catch (err) {
        // ignore
    }
    next();
}

module.exports = { authMiddleware, optionalAuth };
