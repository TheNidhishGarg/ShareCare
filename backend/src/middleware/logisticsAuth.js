const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function logisticsAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            data: null,
            error: 'Missing logistics authorization',
            meta: {},
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.LOGISTICS_JWT_SECRET);
        req.deliveryId = decoded.deliveryId;
        req.partnerId = decoded.partnerId;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            data: null,
            error: 'Invalid logistics token',
            meta: {},
        });
    }
}

module.exports = { logisticsAuth };
