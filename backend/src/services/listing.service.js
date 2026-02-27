const { prisma } = require('../config/prisma');
const { redis } = require('../config/redis');
const ngeohash = require('ngeohash');
const { AppError } = require('../middleware/errorHandler');

class ListingService {
    // Get listings within radius using PostGIS
    async getListingsFeed({ lat, lng, radius, category, cursor, limit }) {
        const radiusMeters = Math.min(radius, 2000); // Hard cap at 2km

        // Build WHERE conditions
        let categoryFilter = '';
        const params = [lng, lat, lng, lat, radiusMeters, limit];
        let paramIndex = 7;

        if (category) {
            categoryFilter = `AND c.slug = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        let cursorFilter = '';
        if (cursor) {
            cursorFilter = `AND l.created_at < $${paramIndex}`;
            params.push(new Date(cursor));
            paramIndex++;
        }

        const query = `
      SELECT 
        l.id, l.title, l.description, l.condition, l.image_urls,
        l.status, l.pickup_mode, l.latitude, l.longitude, l.address_display,
        l.view_count, l.is_sponsored, l.created_at, l.updated_at,
        l.donor_id, l.category_id, l.expires_at,
        u.name as donor_name, u.profile_photo as donor_photo,
        c.name as category_name, c.slug as category_slug, c.icon_url as category_icon,
        ST_Distance(
          l.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_meters
      FROM listings l
      JOIN users u ON l.donor_id = u.id
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE l.status = 'active'
        AND (l.expires_at IS NULL OR l.expires_at > NOW())
        AND ST_DWithin(
          l.location,
          ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
          $5
        )
        ${categoryFilter}
        ${cursorFilter}
      ORDER BY l.is_sponsored DESC, l.created_at DESC
      LIMIT $6
    `;

        const listings = await prisma.$queryRawUnsafe(query, ...params);

        // Format response
        const formattedListings = listings.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            condition: l.condition,
            imageUrls: l.image_urls || [],
            status: l.status,
            pickupMode: l.pickup_mode,
            latitude: parseFloat(l.latitude),
            longitude: parseFloat(l.longitude),
            addressDisplay: l.address_display,
            viewCount: l.view_count,
            isSponsored: l.is_sponsored,
            distanceMeters: Math.round(parseFloat(l.distance_meters || 0)),
            createdAt: l.created_at,
            expiresAt: l.expires_at,
            donor: {
                id: l.donor_id,
                name: l.donor_name,
                profilePhoto: l.donor_photo,
            },
            category: l.category_id
                ? {
                    id: l.category_id,
                    name: l.category_name,
                    slug: l.category_slug,
                    iconUrl: l.category_icon,
                }
                : null,
        }));

        const nextCursor =
            formattedListings.length === limit
                ? formattedListings[formattedListings.length - 1].createdAt.toISOString()
                : null;

        return { listings: formattedListings, nextCursor };
    }

    // Create listing
    async createListing(donorId, data) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const listing = await prisma.listing.create({
            data: {
                donorId,
                categoryId: data.categoryId,
                title: data.title,
                description: data.description,
                condition: data.condition,
                imageUrls: data.imageUrls || [],
                pickupMode: data.pickupMode,
                latitude: data.latitude,
                longitude: data.longitude,
                addressDisplay: data.addressDisplay,
                expiresAt,
            },
            include: {
                category: true,
                donor: { select: { id: true, name: true, profilePhoto: true } },
            },
        });

        // Update PostGIS location via raw SQL
        await prisma.$executeRawUnsafe(
            `UPDATE listings SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
            data.longitude,
            data.latitude,
            listing.id
        );

        // Invalidate cache for this geohash
        const geohash = ngeohash.encode(data.latitude, data.longitude, 5);
        await redis.del(`listings:${geohash}:*`);

        return listing;
    }

    // Get single listing
    async getListingById(id) {
        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                category: true,
                donor: { select: { id: true, name: true, profilePhoto: true, phone: true } },
            },
        });

        if (!listing) {
            throw new AppError('Listing not found', 404);
        }

        return listing;
    }

    // Update listing
    async updateListing(id, donorId, data) {
        const listing = await prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new AppError('Listing not found', 404);
        if (listing.donorId !== donorId) throw new AppError('Not authorized', 403);

        const updated = await prisma.listing.update({
            where: { id },
            data,
            include: { category: true },
        });

        // Update PostGIS if location changed
        if (data.latitude && data.longitude) {
            await prisma.$executeRawUnsafe(
                `UPDATE listings SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography WHERE id = $3`,
                data.longitude,
                data.latitude,
                id
            );
        }

        return updated;
    }

    // Delete listing
    async deleteListing(id, donorId) {
        const listing = await prisma.listing.findUnique({ where: { id } });
        if (!listing) throw new AppError('Listing not found', 404);
        if (listing.donorId !== donorId) throw new AppError('Not authorized', 403);

        await prisma.listing.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    // Get donor's own listings
    async getDonorListings(donorId) {
        return prisma.listing.findMany({
            where: { donorId },
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Increment view count
    async incrementViewCount(id) {
        await prisma.listing.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
    }
}

module.exports = new ListingService();
