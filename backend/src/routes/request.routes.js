const express = require('express');
const router = express.Router();
const requestService = require('../services/request.service');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createRequestSchema, verifyOtpRequestSchema } = require('../validators');

// POST /api/v1/requests
router.post('/', authMiddleware, validate(createRequestSchema), async (req, res, next) => {
    try {
        const request = await requestService.createRequest(req.userId, req.validatedBody);
        res.status(201).json({ success: true, data: request, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/requests/mine — Receiver's requests
router.get('/mine', authMiddleware, async (req, res, next) => {
    try {
        const requests = await requestService.getReceiverRequests(req.userId);
        res.json({ success: true, data: requests, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/requests/incoming — Donor's incoming requests
router.get('/incoming', authMiddleware, async (req, res, next) => {
    try {
        const requests = await requestService.getDonorIncomingRequests(req.userId);
        res.json({ success: true, data: requests, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/requests/:id/accept
router.put('/:id/accept', authMiddleware, async (req, res, next) => {
    try {
        const request = await requestService.acceptRequest(req.params.id, req.userId);
        res.json({ success: true, data: request, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/requests/:id/reject
router.put('/:id/reject', authMiddleware, async (req, res, next) => {
    try {
        await requestService.rejectRequest(req.params.id, req.userId);
        res.json({ success: true, data: { message: 'Request rejected' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/requests/:id/cancel
router.put('/:id/cancel', authMiddleware, async (req, res, next) => {
    try {
        await requestService.cancelRequest(req.params.id, req.userId);
        res.json({ success: true, data: { message: 'Request cancelled' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/requests/:id/otp — Receiver gets OTP status
router.get('/:id/otp', authMiddleware, async (req, res, next) => {
    try {
        const result = await requestService.getReceiverOtp(req.params.id, req.userId);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/requests/:id/verify-otp — Donor verifies pickup OTP
router.post('/:id/verify-otp', authMiddleware, validate(verifyOtpRequestSchema), async (req, res, next) => {
    try {
        const result = await requestService.verifyPickupOtp(req.params.id, req.userId, req.validatedBody.otp);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
