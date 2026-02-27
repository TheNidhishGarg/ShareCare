const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');
const { queues } = require('../config/bull');
const socketEmitter = require('../socket/emitter');

class DeliveryService {
    // Create doorstep delivery
    async createDelivery(userId, data) {
        const request = await prisma.request.findUnique({
            where: { id: data.requestId },
            include: { listing: true },
        });

        if (!request) throw new AppError('Request not found', 404);
        if (request.receiverId !== userId) throw new AppError('Not authorized', 403);
        if (request.status !== 'accepted') throw new AppError('Request must be accepted first', 400);
        if (request.deliveryMode !== 'doorstep') throw new AppError('Request is not set for doorstep delivery', 400);

        // Fetch receiver address
        const address = await prisma.userAddress.findUnique({ where: { id: data.addressId } });
        if (!address) throw new AppError('Address not found', 404);
        if (address.userId !== userId) throw new AppError('Address does not belong to user', 403);

        // Generate QR code token
        const qrCodeToken = crypto.randomUUID();

        // Generate QR code as base64
        const qrDataUrl = await QRCode.toDataURL(qrCodeToken, { width: 400 });

        // Snapshot address
        const deliveryAddress = {
            label: address.label,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: parseFloat(address.latitude),
            longitude: parseFloat(address.longitude),
        };

        // Calculate delivery charges
        const partnerCharge = 80; // Base charge (would come from logistics API in production)
        const marginPercent = env.DELIVERY_BASE_MARGIN_PERCENT / 100;
        const marginAmount = partnerCharge * marginPercent;
        const minMargin = env.DELIVERY_MINIMUM_MARGIN_INR;
        const platformMargin = Math.max(marginAmount, minMargin);
        const userCharge = partnerCharge + platformMargin;

        const delivery = await prisma.delivery.create({
            data: {
                requestId: data.requestId,
                receiverAddressId: data.addressId,
                deliveryAddress,
                qrCodeToken,
                deliveryChargePartner: partnerCharge,
                deliveryChargeUser: userCharge,
                platformMargin,
                logisticsPartner: 'ShareCare Logistics',
            },
        });

        // Generate logistics JWT
        const logisticsToken = jwt.sign(
            { deliveryId: delivery.id, partnerId: 'sharecare' },
            env.LOGISTICS_JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Notify donor with QR code
        socketEmitter.emitToUser(request.donorId, 'delivery.created', {
            deliveryId: delivery.id,
            requestId: request.id,
        });

        return {
            delivery,
            qrCodeDataUrl: qrDataUrl,
            logisticsToken,
            deliveryCharge: userCharge,
        };
    }

    // Get delivery status
    async getDeliveryById(deliveryId, userId) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: {
                request: {
                    include: {
                        listing: true,
                        receiver: { select: { id: true, name: true } },
                        donor: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);

        // Only allow parties involved to view
        if (
            delivery.request.receiverId !== userId &&
            delivery.request.donorId !== userId
        ) {
            throw new AppError('Not authorized', 403);
        }

        return delivery;
    }

    // Get QR code for donor
    async getQrCode(deliveryId, donorId) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { request: true },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);
        if (delivery.request.donorId !== donorId) throw new AppError('Not authorized', 403);

        const qrDataUrl = await QRCode.toDataURL(delivery.qrCodeToken, { width: 400 });
        return { qrCodeDataUrl: qrDataUrl };
    }

    // Logistics partner scans QR
    async scanQr(deliveryId, token) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { request: true },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);

        // Validate token
        if (delivery.qrCodeToken !== token) {
            throw new AppError('Invalid QR code', 400);
        }

        // Single-use check
        if (delivery.qrScannedAt) {
            throw new AppError('QR code has already been scanned', 400);
        }

        await prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                qrScannedAt: new Date(),
                status: 'picked_up',
                pickupConfirmedAt: new Date(),
            },
        });

        // Notify both parties
        socketEmitter.emitToUser(delivery.request.donorId, 'delivery.qr_scanned', {
            deliveryId: delivery.id,
        });
        socketEmitter.emitToUser(delivery.request.receiverId, 'delivery.qr_scanned', {
            deliveryId: delivery.id,
        });

        return { message: 'QR scanned successfully. Pickup confirmed.' };
    }

    // Get receiver address (only after QR scan)
    async getDeliveryAddress(deliveryId) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);

        if (!delivery.qrScannedAt) {
            throw new AppError('QR code must be scanned before accessing address', 403);
        }

        return { address: delivery.deliveryAddress };
    }

    // Verify delivery OTP
    async verifyDeliveryOtp(deliveryId, otp) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { request: { include: { listing: true } } },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);
        if (delivery.status !== 'in_transit' && delivery.status !== 'picked_up') {
            throw new AppError('Delivery is not in transit', 400);
        }

        if (!delivery.request.deliveryOtp) {
            throw new AppError('No delivery OTP set', 400);
        }

        const isValid = await bcrypt.compare(otp, delivery.request.deliveryOtp);
        if (!isValid) throw new AppError('Invalid OTP', 400);

        // Complete delivery
        await prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                status: 'delivered',
                deliveredAt: new Date(),
            },
        });

        await prisma.request.update({
            where: { id: delivery.requestId },
            data: {
                status: 'completed',
                deliveryOtpVerifiedAt: new Date(),
            },
        });

        await prisma.listing.update({
            where: { id: delivery.request.listingId },
            data: { status: 'completed' },
        });

        // Notify both parties
        socketEmitter.emitToUser(delivery.request.donorId, 'delivery.completed', {
            deliveryId: delivery.id,
        });
        socketEmitter.emitToUser(delivery.request.receiverId, 'delivery.completed', {
            deliveryId: delivery.id,
        });

        return { message: 'Delivery confirmed. Transaction complete!' };
    }

    // Generate delivery OTP (called when item is in transit)
    async generateDeliveryOtp(deliveryId) {
        const delivery = await prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { request: { include: { receiver: true } } },
        });

        if (!delivery) throw new AppError('Delivery not found', 404);

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        await prisma.request.update({
            where: { id: delivery.requestId },
            data: { deliveryOtp: otpHash },
        });

        // Store in otp_logs
        await prisma.otpLog.create({
            data: {
                userId: delivery.request.receiverId,
                phone: delivery.request.receiver.phone,
                otpHash,
                purpose: 'delivery_verify',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
        });

        // Send OTP to receiver
        if (env.TWILIO_ACCOUNT_SID && delivery.request.receiver.phone) {
            await queues.sendOtp.add('delivery-otp', {
                phone: delivery.request.receiver.phone,
                otp,
            });
        } else {
            console.log(`📱 [DEV] Delivery OTP for ${delivery.request.receiver.phone}: ${otp}`);
        }

        return { message: 'Delivery OTP sent to receiver' };
    }
}

module.exports = new DeliveryService();
