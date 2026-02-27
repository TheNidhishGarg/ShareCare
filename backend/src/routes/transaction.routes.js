const express = require('express');
const router = express.Router();
const { prisma } = require('../config/prisma');
const paymentService = require('../services/payment.service');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { initiateTransactionSchema } = require('../validators');

// POST /api/v1/transactions/initiate
router.post('/initiate', authMiddleware, validate(initiateTransactionSchema), async (req, res, next) => {
    try {
        const { type, amount, requestId, deliveryId } = req.validatedBody;

        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                requestId,
                deliveryId,
                type,
                amount,
                paymentGateway: 'razorpay',
                status: 'pending',
            },
        });

        // Create payment order
        const order = await paymentService.createOrder(amount, 'INR', transaction.id);

        res.json({
            success: true,
            data: {
                transactionId: transaction.id,
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency || 'INR',
            },
            error: null,
            meta: {},
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/transactions/webhook — Payment gateway callback
router.post('/webhook', async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = paymentService.verifySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({ success: false, data: null, error: 'Invalid signature', meta: {} });
        }

        // Update transaction status
        await prisma.transaction.updateMany({
            where: { gatewayTxnId: razorpay_order_id },
            data: { status: 'paid', gatewayTxnId: razorpay_payment_id },
        });

        res.json({ success: true, data: { message: 'Payment confirmed' }, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
