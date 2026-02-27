const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validate');
const { createSponsoredSlotSchema } = require('../validators');

// POST /api/v1/sponsored/create (Admin only)
router.post('/create', authMiddleware, adminAuth, validate(createSponsoredSlotSchema), async (req, res, next) => {
    try {
        const slot = await prisma.sponsoredSlot.create({
            data: {
                ...req.validatedBody,
                startsAt: req.validatedBody.startsAt ? new Date(req.validatedBody.startsAt) : null,
                endsAt: req.validatedBody.endsAt ? new Date(req.validatedBody.endsAt) : null,
            },
        });
        res.status(201).json({ success: true, data: slot, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/sponsored/active
router.get('/active', authMiddleware, async (req, res, next) => {
    try {
        const slots = await prisma.sponsoredSlot.findMany({
            where: {
                isActive: true,
                OR: [
                    { endsAt: null },
                    { endsAt: { gte: new Date() } },
                ],
            },
            orderBy: { displayOrder: 'asc' },
        });
        res.json({ success: true, data: slots, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
