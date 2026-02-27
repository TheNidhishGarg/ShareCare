const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const { authMiddleware } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const { locationQuerySchema } = require('../validators');

// GET /api/v1/ai/suggestions
router.get('/suggestions', authMiddleware, validateQuery(locationQuerySchema), async (req, res, next) => {
    try {
        const suggestions = await aiService.getSuggestions(
            req.validatedQuery.lat,
            req.validatedQuery.lng
        );
        res.json({ success: true, data: suggestions, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/ai/trending
router.get('/trending', authMiddleware, validateQuery(locationQuerySchema), async (req, res, next) => {
    try {
        const trending = await aiService.getTrending(
            req.validatedQuery.lat,
            req.validatedQuery.lng
        );
        res.json({ success: true, data: trending, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
