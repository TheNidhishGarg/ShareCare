const express = require('express');
const router = express.Router();
const deliveryService = require('../services/delivery.service');
const { authMiddleware } = require('../middleware/auth');
const { logisticsAuth } = require('../middleware/logisticsAuth');
const { validate } = require('../middleware/validate');
const { createDeliverySchema, scanQrSchema, verifyOtpRequestSchema } = require('../validators');

// POST /api/v1/deliveries — Create doorstep delivery
router.post('/', authMiddleware, validate(createDeliverySchema), async (req, res, next) => {
    try {
        const result = await deliveryService.createDelivery(req.userId, req.validatedBody);
        res.status(201).json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/deliveries/:id — Get delivery status
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const delivery = await deliveryService.getDeliveryById(req.params.id, req.userId);
        res.json({ success: true, data: delivery, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/deliveries/:id/qr — Get QR code (donor only)
router.get('/:id/qr', authMiddleware, async (req, res, next) => {
    try {
        const result = await deliveryService.getQrCode(req.params.id, req.userId);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/deliveries/:id/scan-qr — Logistics scans QR
router.post('/:id/scan-qr', logisticsAuth, validate(scanQrSchema), async (req, res, next) => {
    try {
        const result = await deliveryService.scanQr(req.params.id, req.validatedBody.token);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/deliveries/:id/address — Get receiver address (logistics, post-QR only)
router.get('/:id/address', logisticsAuth, async (req, res, next) => {
    try {
        const result = await deliveryService.getDeliveryAddress(req.params.id);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/deliveries/:id/verify-delivery-otp — Logistics verifies delivery
router.post('/:id/verify-delivery-otp', logisticsAuth, validate(verifyOtpRequestSchema), async (req, res, next) => {
    try {
        const result = await deliveryService.verifyDeliveryOtp(req.params.id, req.validatedBody.otp);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
