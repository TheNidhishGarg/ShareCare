const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prisma');

// GET /api/v1/categories
router.get('/', async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
        res.json({ success: true, data: categories, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
