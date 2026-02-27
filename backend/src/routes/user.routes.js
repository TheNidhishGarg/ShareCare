const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileSchema, createAddressSchema, updateAddressSchema } = require('../validators');

// GET /api/v1/users/me
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { addresses: true },
        });
        if (!user) return res.status(404).json({ success: false, data: null, error: 'User not found', meta: {} });
        res.json({ success: true, data: user, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/users/me
router.put('/me', authMiddleware, validate(updateProfileSchema), async (req, res, next) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: req.validatedBody,
        });
        res.json({ success: true, data: user, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/users/me/addresses
router.get('/me/addresses', authMiddleware, async (req, res, next) => {
    try {
        const addresses = await prisma.userAddress.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: addresses, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/users/me/addresses
router.post('/me/addresses', authMiddleware, validate(createAddressSchema), async (req, res, next) => {
    try {
        const data = req.validatedBody;

        // If setting as default, unset other defaults
        if (data.isDefault) {
            await prisma.userAddress.updateMany({
                where: { userId: req.userId },
                data: { isDefault: false },
            });
        }

        const address = await prisma.userAddress.create({
            data: { ...data, userId: req.userId },
        });

        // Update PostGIS location
        await prisma.$executeRawUnsafe(
            `UPDATE user_addresses SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
            data.longitude,
            data.latitude,
            address.id
        );

        res.status(201).json({ success: true, data: address, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/users/me/addresses/:id
router.put('/me/addresses/:id', authMiddleware, validate(updateAddressSchema), async (req, res, next) => {
    try {
        const existing = await prisma.userAddress.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.userId !== req.userId) {
            return res.status(404).json({ success: false, data: null, error: 'Address not found', meta: {} });
        }

        if (req.validatedBody.isDefault) {
            await prisma.userAddress.updateMany({
                where: { userId: req.userId },
                data: { isDefault: false },
            });
        }

        const address = await prisma.userAddress.update({
            where: { id: req.params.id },
            data: req.validatedBody,
        });

        if (req.validatedBody.latitude && req.validatedBody.longitude) {
            await prisma.$executeRawUnsafe(
                `UPDATE user_addresses SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
                req.validatedBody.longitude,
                req.validatedBody.latitude,
                address.id
            );
        }

        res.json({ success: true, data: address, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/v1/users/me/addresses/:id
router.delete('/me/addresses/:id', authMiddleware, async (req, res, next) => {
    try {
        const existing = await prisma.userAddress.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.userId !== req.userId) {
            return res.status(404).json({ success: false, data: null, error: 'Address not found', meta: {} });
        }

        await prisma.userAddress.delete({ where: { id: req.params.id } });
        res.json({ success: true, data: { message: 'Address deleted' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
