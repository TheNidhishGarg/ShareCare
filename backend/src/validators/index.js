const { z } = require('zod');

// Auth validators
const requestOtpSchema = z.object({
    phone: z
        .string()
        .min(10)
        .max(15)
        .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});

const verifyOtpSchema = z.object({
    phone: z
        .string()
        .min(10)
        .max(15)
        .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

// User validators
const updateProfileSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    profilePhoto: z.string().url().optional(),
    defaultMode: z.enum(['receiver', 'donor']).optional(),
});

const createAddressSchema = z.object({
    label: z.string().max(100).optional(),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    pincode: z.string().max(10).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

// Listing validators
const createListingSchema = z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    condition: z.enum(['new_item', 'like_new', 'good', 'fair']).default('good'),
    imageUrls: z.array(z.string()).max(5).default([]),
    pickupMode: z.enum(['self_pickup', 'doorstep', 'both']).default('both'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    addressDisplay: z.string().optional(),
});

const updateListingSchema = createListingSchema.partial();

const listingsQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(100).max(2000).default(2000),
    category: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

// Request validators
const createRequestSchema = z.object({
    listingId: z.string().uuid(),
    deliveryMode: z.enum(['self_pickup', 'doorstep']),
});

const verifyOtpRequestSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Delivery validators
const createDeliverySchema = z.object({
    requestId: z.string().uuid(),
    addressId: z.string().uuid(),
});

const scanQrSchema = z.object({
    token: z.string().uuid(),
});

// Transaction validators
const initiateTransactionSchema = z.object({
    requestId: z.string().uuid().optional(),
    deliveryId: z.string().uuid().optional(),
    type: z.enum(['delivery_charge', 'sponsored_listing', 'advertisement']),
    amount: z.number().positive(),
});

// Sponsored slot validators
const createSponsoredSlotSchema = z.object({
    entityType: z.enum(['ngo', 'listing', 'advertisement']),
    entityId: z.string().uuid().optional(),
    entityName: z.string().max(255).optional(),
    logoUrl: z.string().url().optional(),
    linkUrl: z.string().url().optional(),
    displayOrder: z.number().int().default(0),
    regionKey: z.string().max(100).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    amountPaid: z.number().positive().optional(),
});

// Location query (for AI endpoints)
const locationQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
});

module.exports = {
    requestOtpSchema,
    verifyOtpSchema,
    updateProfileSchema,
    createAddressSchema,
    updateAddressSchema,
    createListingSchema,
    updateListingSchema,
    listingsQuerySchema,
    createRequestSchema,
    verifyOtpRequestSchema,
    createDeliverySchema,
    scanQrSchema,
    initiateTransactionSchema,
    createSponsoredSlotSchema,
    locationQuerySchema,
};
