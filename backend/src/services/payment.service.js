const { env } = require('../config/env');

class PaymentService {
    constructor() {
        this.isStubMode = !env.RAZORPAY_KEY_ID;
        if (this.isStubMode) {
            console.log('💳 Payment service running in STUB mode');
        }
    }

    // Initiate payment
    async createOrder(amount, currency = 'INR', receiptId) {
        if (this.isStubMode) {
            return {
                orderId: `stub_order_${Date.now()}`,
                amount: amount * 100,
                currency,
                receipt: receiptId,
                status: 'created',
            };
        }

        // Production: call Razorpay Orders API
        // const Razorpay = require('razorpay');
        // const instance = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
        // return instance.orders.create({ amount: amount * 100, currency, receipt: receiptId });
        return { orderId: `stub_order_${Date.now()}`, amount: amount * 100, currency };
    }

    // Verify payment signature
    verifySignature(orderId, paymentId, signature) {
        if (this.isStubMode) {
            return true;
        }

        // Production: verify Razorpay signature
        // const crypto = require('crypto');
        // const body = orderId + '|' + paymentId;
        // const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
        // return expected === signature;
        return true;
    }
}

module.exports = new PaymentService();
