const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const { authMiddleware } = require('../middleware/auth');

// GET /api/v1/notifications
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.userId);
        const unreadCount = await notificationService.getUnreadCount(req.userId);
        res.json({
            success: true,
            data: notifications,
            error: null,
            meta: { unreadCount },
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
    try {
        await notificationService.markAsRead(req.params.id, req.userId);
        res.json({ success: true, data: null, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/notifications/read-all
router.put('/read-all', authMiddleware, async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.userId);
        res.json({ success: true, data: null, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
