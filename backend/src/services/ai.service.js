const ngeohash = require('ngeohash');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');

// Seasonal rules configuration
const seasonalRules = [
    {
        trigger: 'seasonal',
        months: [11, 12, 1],
        categories: ['Clothing'],
        messageTemplate: '{category} demand is rising in winter in your area. Consider donating.',
    },
    {
        trigger: 'seasonal',
        months: [4, 5, 6],
        categories: ['Electronics'],
        messageTemplate: 'Summer is here. {category} donations are in high demand near you.',
    },
    {
        trigger: 'seasonal',
        months: [6, 7],
        categories: ['Books', 'Stationery'],
        messageTemplate: 'Schools are reopening. Book and stationery donations needed near you.',
    },
    {
        trigger: 'seasonal',
        months: [10, 11],
        categories: ['Clothing'],
        messageTemplate: 'Festive season is here. Donate clothes to those who need them.',
    },
];

class AiService {
    // Compute geohash from coordinates
    getGeohash(lat, lng, precision = 5) {
        return ngeohash.encode(lat, lng, precision);
    }

    // Get suggestions for a user's location
    async getSuggestions(lat, lng) {
        const regionKey = this.getGeohash(lat, lng);
        const maxResults = env.AI_SUGGESTION_MAX_PER_LOCATION;

        const suggestions = await prisma.aiSuggestion.findMany({
            where: {
                regionKey,
                isActive: true,
                validUntil: { gte: new Date() },
            },
            include: {
                category: { select: { name: true, slug: true, iconUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: maxResults,
        });

        return suggestions;
    }

    // Get trending categories near user
    async getTrending(lat, lng) {
        const regionKey = this.getGeohash(lat, lng);

        const snapshots = await prisma.aiDemandSnapshot.findMany({
            where: {
                regionKey,
                snapshotDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            include: {
                category: { select: { name: true, slug: true, iconUrl: true } },
            },
            orderBy: { demandScore: 'desc' },
            take: 5,
        });

        return snapshots;
    }

    // ===== SCHEDULED JOBS =====

    // Daily demand snapshot (runs at 2 AM)
    async computeDemandSnapshots() {
        console.log('📊 Computing demand snapshots...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const categories = await prisma.category.findMany({ where: { isActive: true } });

        // Get all unique geohash regions from active listings
        const listings = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT substring(ST_GeoHash(location::geometry, 5) for 5) as geohash
      FROM listings WHERE status = 'active'
    `);

        const regions = listings.map((l) => l.geohash).filter(Boolean);

        for (const category of categories) {
            for (const regionKey of regions) {
                // Count active listings in this region/category
                const listingCount = await prisma.listing.count({
                    where: {
                        categoryId: category.id,
                        status: 'active',
                    },
                });

                // Count requests in last 7 days for this category
                const requestCount = await prisma.request.count({
                    where: {
                        listing: { categoryId: category.id },
                        status: { in: ['pending', 'accepted'] },
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                });

                const demandScore = requestCount / Math.max(listingCount, 1);

                await prisma.aiDemandSnapshot.upsert({
                    where: {
                        id: `${category.id}-${regionKey}-${today.toISOString().split('T')[0]}`,
                    },
                    update: { requestCount, listingCount, demandScore },
                    create: {
                        categoryId: category.id,
                        regionKey,
                        requestCount,
                        listingCount,
                        demandScore,
                        snapshotDate: today,
                    },
                });
            }
        }

        console.log('✅ Demand snapshots computed');
    }

    // Monthly seasonal suggestions (runs on 1st of each month)
    async generateSeasonalSuggestions() {
        console.log('🌿 Generating seasonal suggestions...');
        const currentMonth = new Date().getMonth() + 1;
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const matchingRules = seasonalRules.filter((r) => r.months.includes(currentMonth));

        for (const rule of matchingRules) {
            for (const categoryName of rule.categories) {
                const category = await prisma.category.findUnique({
                    where: { name: categoryName },
                });
                if (!category) continue;

                // Get regions with demand score > 1.5
                const snapshots = await prisma.aiDemandSnapshot.findMany({
                    where: {
                        categoryId: category.id,
                        demandScore: { gt: 1.5 },
                    },
                    select: { regionKey: true },
                    distinct: ['regionKey'],
                });

                for (const { regionKey } of snapshots) {
                    const message = rule.messageTemplate.replace('{category}', categoryName);

                    await prisma.aiSuggestion.create({
                        data: {
                            categoryId: category.id,
                            regionKey,
                            message,
                            triggerType: 'seasonal',
                            validFrom: today,
                            validUntil: lastDayOfMonth,
                        },
                    });
                }
            }
        }

        console.log('✅ Seasonal suggestions generated');
    }

    // Spike detection (runs every 6 hours)
    async detectSpikes() {
        console.log('📈 Detecting demand spikes...');
        const threshold = env.DEMAND_SPIKE_THRESHOLD_MULTIPLIER;

        const categories = await prisma.category.findMany({ where: { isActive: true } });
        const snapshots = await prisma.aiDemandSnapshot.findMany({
            where: {
                snapshotDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            select: { regionKey: true },
            distinct: ['regionKey'],
        });

        const regions = snapshots.map((s) => s.regionKey);

        for (const category of categories) {
            for (const regionKey of regions) {
                // Count requests in last 24 hours
                const todayRequests = await prisma.request.count({
                    where: {
                        listing: { categoryId: category.id },
                        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    },
                });

                // Get 7-day average
                const weekSnapshots = await prisma.aiDemandSnapshot.findMany({
                    where: {
                        categoryId: category.id,
                        regionKey,
                        snapshotDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    },
                });

                const avgRequests =
                    weekSnapshots.length > 0
                        ? weekSnapshots.reduce((sum, s) => sum + s.requestCount, 0) / weekSnapshots.length
                        : 0;

                if (todayRequests > avgRequests * threshold && todayRequests > 0) {
                    // Check if spike suggestion already exists
                    const existing = await prisma.aiSuggestion.findFirst({
                        where: {
                            categoryId: category.id,
                            regionKey,
                            triggerType: 'spike',
                            isActive: true,
                            validUntil: { gte: new Date() },
                        },
                    });

                    if (!existing) {
                        await prisma.aiSuggestion.create({
                            data: {
                                categoryId: category.id,
                                regionKey,
                                message: `${category.name} demand has spiked in your area. Consider donating.`,
                                triggerType: 'spike',
                                validFrom: new Date(),
                                validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
                            },
                        });
                    }
                }
            }
        }

        console.log('✅ Spike detection complete');
    }
}

module.exports = new AiService();
