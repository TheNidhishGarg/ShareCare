const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');
const { queues } = require('../config/bull');
const { env } = require('../config/env');
const socketEmitter = require('../socket/emitter');

class RequestService {
    // Create request on a listing
    async createRequest(receiverId, data) {
        const listing = await prisma.listing.findUnique({
            where: { id: data.listingId },
            include: { donor: true },
        });

        if (!listing) throw new AppError('Listing not found', 404);
        if (listing.status !== 'active') throw new AppError('Listing is not available', 400);
        if (listing.donorId === receiverId) throw new AppError('Cannot request your own listing', 400);

        // Check existing pending/accepted request
        const existing = await prisma.request.findFirst({
            where: {
                listingId: data.listingId,
                receiverId,
                status: { in: ['pending', 'accepted', 'otp_sent'] },
            },
        });
        if (existing) throw new AppError('You already have an active request for this item', 400);

        const request = await prisma.request.create({
            data: {
                listingId: data.listingId,
                receiverId,
                donorId: listing.donorId,
                deliveryMode: data.deliveryMode,
            },
            include: {
                listing: { include: { category: true } },
                receiver: { select: { id: true, name: true } },
            },
        });

        // Update listing status to reserved
        await prisma.listing.update({
            where: { id: data.listingId },
            data: { status: 'reserved' },
        });

        // Notify donor
        await queues.sendNotification.add('new-request', {
            userId: listing.donorId,
            type: 'request.new',
            title: 'New Request',
            body: `${request.receiver.name || 'Someone'} wants your "${listing.title}"`,
            data: { requestId: request.id, listingId: listing.id },
        });

        // Socket event
        socketEmitter.emitToUser(listing.donorId, 'request.new', {
            requestId: request.id,
            receiverName: request.receiver.name,
            listingTitle: listing.title,
        });

        return request;
    }

    // Get receiver's requests
    async getReceiverRequests(receiverId) {
        return prisma.request.findMany({
            where: { receiverId },
            include: {
                listing: { include: { category: true } },
                donor: { select: { id: true, name: true, profilePhoto: true } },
                deliveries: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get donor's incoming requests
    async getDonorIncomingRequests(donorId) {
        return prisma.request.findMany({
            where: { donorId, status: { in: ['pending', 'accepted', 'otp_sent'] } },
            include: {
                listing: { include: { category: true } },
                receiver: { select: { id: true, name: true, profilePhoto: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Donor accepts request
    async acceptRequest(requestId, donorId) {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            include: { listing: true, receiver: true },
        });

        if (!request) throw new AppError('Request not found', 404);
        if (request.donorId !== donorId) throw new AppError('Not authorized', 403);
        if (request.status !== 'pending') throw new AppError('Request is not pending', 400);

        // Generate OTP for pickup verification
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

        const updated = await prisma.request.update({
            where: { id: requestId },
            data: {
                status: 'accepted',
                receiverOtp: otpHash,
                otpExpiresAt,
            },
            include: { listing: true },
        });

        // Store in otp_logs
        await prisma.otpLog.create({
            data: {
                userId: request.receiverId,
                phone: request.receiver.phone,
                otpHash,
                purpose: 'pickup_verify',
                expiresAt: otpExpiresAt,
            },
        });

        // Send OTP via SMS (or log in dev)
        if (env.TWILIO_ACCOUNT_SID && request.receiver.phone) {
            await queues.sendOtp.add('pickup-otp', {
                phone: request.receiver.phone,
                otp,
            });
        } else {
            console.log(`📱 [DEV] Pickup OTP for ${request.receiver.phone}: ${otp}`);
        }

        // Notify receiver
        await queues.sendNotification.add('request-accepted', {
            userId: request.receiverId,
            type: 'request.accepted',
            title: 'Request Accepted!',
            body: `Your request for "${request.listing.title}" has been accepted`,
            data: { requestId: request.id },
        });

        socketEmitter.emitToUser(request.receiverId, 'request.accepted', {
            requestId: request.id,
            listingTitle: request.listing.title,
        });

        return updated;
    }

    // Donor rejects request
    async rejectRequest(requestId, donorId) {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            include: { listing: true },
        });

        if (!request) throw new AppError('Request not found', 404);
        if (request.donorId !== donorId) throw new AppError('Not authorized', 403);
        if (request.status !== 'pending') throw new AppError('Request is not pending', 400);

        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'rejected' },
        });

        // Re-activate listing
        await prisma.listing.update({
            where: { id: request.listingId },
            data: { status: 'active' },
        });

        // Notify receiver
        socketEmitter.emitToUser(request.receiverId, 'request.rejected', {
            requestId: request.id,
            listingTitle: request.listing.title,
        });
    }

    // Receiver cancels request
    async cancelRequest(requestId, userId) {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            include: { listing: true },
        });

        if (!request) throw new AppError('Request not found', 404);
        if (request.receiverId !== userId && request.donorId !== userId) {
            throw new AppError('Not authorized', 403);
        }
        if (['completed', 'cancelled'].includes(request.status)) {
            throw new AppError('Request cannot be cancelled', 400);
        }

        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'cancelled' },
        });

        // Re-activate listing
        await prisma.listing.update({
            where: { id: request.listingId },
            data: { status: 'active' },
        });
    }

    // Get receiver OTP (only for accepted self-pickup)
    async getReceiverOtp(requestId, receiverId) {
        const request = await prisma.request.findUnique({ where: { id: requestId } });
        if (!request) throw new AppError('Request not found', 404);
        if (request.receiverId !== receiverId) throw new AppError('Not authorized', 403);
        if (!['accepted', 'otp_sent'].includes(request.status)) {
            throw new AppError('OTP not available for this request status', 400);
        }

        // We don't return the OTP hash — the OTP was sent via SMS
        return {
            status: request.status,
            otpExpiresAt: request.otpExpiresAt,
            hasPendingOtp: !!request.receiverOtp && request.otpExpiresAt > new Date(),
        };
    }

    // Donor verifies pickup OTP
    async verifyPickupOtp(requestId, donorId, otp) {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            include: { listing: true },
        });

        if (!request) throw new AppError('Request not found', 404);
        if (request.donorId !== donorId) throw new AppError('Not authorized', 403);
        if (!['accepted', 'otp_sent'].includes(request.status)) {
            throw new AppError('Request not in verifiable state', 400);
        }
        if (!request.otpExpiresAt || request.otpExpiresAt < new Date()) {
            throw new AppError('OTP has expired', 400);
        }

        const isValid = await bcrypt.compare(otp, request.receiverOtp);
        if (!isValid) throw new AppError('Invalid OTP', 400);

        // Complete the transaction
        await prisma.request.update({
            where: { id: requestId },
            data: {
                status: 'completed',
                otpVerifiedAt: new Date(),
            },
        });

        await prisma.listing.update({
            where: { id: request.listingId },
            data: { status: 'completed' },
        });

        // Mark OTP as used
        await prisma.otpLog.updateMany({
            where: {
                userId: request.receiverId,
                purpose: 'pickup_verify',
                isUsed: false,
            },
            data: { isUsed: true, usedAt: new Date() },
        });

        // Notify both parties
        socketEmitter.emitToUser(request.receiverId, 'request.completed', {
            requestId: request.id,
        });
        socketEmitter.emitToUser(request.donorId, 'request.completed', {
            requestId: request.id,
        });

        return { message: 'Pickup verified. Transaction complete!' };
    }
}

module.exports = new RequestService();
