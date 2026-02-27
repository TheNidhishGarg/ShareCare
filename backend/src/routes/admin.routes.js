const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prisma');
const { authMiddleware } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// GET /api/v1/admin/dashboard
router.get('/dashboard', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const [totalUsers, totalListings, completedTransactions, activeListings, totalRevenue] =
            await Promise.all([
                prisma.user.count(),
                prisma.listing.count(),
                prisma.request.count({ where: { status: 'completed' } }),
                prisma.listing.count({ where: { status: 'active' } }),
                prisma.transaction.aggregate({
                    where: { status: 'paid' },
                    _sum: { amount: true },
                }),
            ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalListings,
                activeListings,
                completedTransactions,
                totalRevenue: totalRevenue._sum.amount || 0,
            },
            error: null,
            meta: {},
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/admin/users
router.get('/users', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const users = await prisma.user.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { listings: true, requestsAsReceiver: true } } },
        });
        const total = await prisma.user.count();
        res.json({ success: true, data: users, error: null, meta: { total, page, limit } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/admin/users/:id/deactivate
router.put('/users/:id/deactivate', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ success: true, data: { message: 'User deactivated' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/admin/listings
router.get('/listings', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '20');
        const listings = await prisma.listing.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                donor: { select: { id: true, name: true, phone: true } },
                category: true,
            },
        });
        const total = await prisma.listing.count();
        res.json({ success: true, data: listings, error: null, meta: { total, page, limit } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/admin/listings/:id/expire
router.put('/listings/:id/expire', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'expired' } });
        res.json({ success: true, data: { message: 'Listing expired' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/admin/transactions
router.get('/transactions', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                request: { select: { id: true, listing: { select: { title: true } } } },
            },
        });
        res.json({ success: true, data: transactions, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/admin/categories
router.get('/categories', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { displayOrder: 'asc' } });
        res.json({ success: true, data: categories, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/admin/categories
router.post('/categories', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const category = await prisma.category.create({ data: req.body });
        res.status(201).json({ success: true, data: category, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/admin/categories/:id
router.put('/categories/:id', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, data: category, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/admin/ai-suggestions
router.get('/ai-suggestions', authMiddleware, adminAuth, async (req, res, next) => {
    try {
        const suggestions = await prisma.aiSuggestion.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: { category: true },
            take: 50,
        });
        res.json({ success: true, data: suggestions, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
