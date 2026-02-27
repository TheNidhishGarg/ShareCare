const express = require('express');
const router = express.Router();
const listingService = require('../services/listing.service');
const { authMiddleware } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { createListingSchema, updateListingSchema, listingsQuerySchema } = require('../validators');

// GET /api/v1/listings — Feed with spatial query
router.get('/', authMiddleware, validateQuery(listingsQuerySchema), async (req, res, next) => {
    try {
        const result = await listingService.getListingsFeed(req.validatedQuery);
        res.json({
            success: true,
            data: result.listings,
            error: null,
            meta: { nextCursor: result.nextCursor },
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/listings/mine — Donor's own listings
router.get('/mine', authMiddleware, async (req, res, next) => {
    try {
        const listings = await listingService.getDonorListings(req.userId);
        res.json({ success: true, data: listings, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/listings/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const listing = await listingService.getListingById(req.params.id);
        res.json({ success: true, data: listing, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/listings
router.post('/', authMiddleware, validate(createListingSchema), async (req, res, next) => {
    try {
        const listing = await listingService.createListing(req.userId, req.validatedBody);
        res.status(201).json({ success: true, data: listing, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/listings/:id
router.put('/:id', authMiddleware, validate(updateListingSchema), async (req, res, next) => {
    try {
        const listing = await listingService.updateListing(req.params.id, req.userId, req.validatedBody);
        res.json({ success: true, data: listing, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/v1/listings/:id
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        await listingService.deleteListing(req.params.id, req.userId);
        res.json({ success: true, data: { message: 'Listing cancelled' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/listings/:id/view — Increment view count
router.post('/:id/view', authMiddleware, async (req, res, next) => {
    try {
        await listingService.incrementViewCount(req.params.id);
        res.json({ success: true, data: null, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
