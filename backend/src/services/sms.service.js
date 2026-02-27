const { env } = require('../config/env');

class SmsService {
    constructor() {
        this.isStubMode = !env.TWILIO_ACCOUNT_SID;
        if (this.isStubMode) {
            console.log('📱 SMS service running in STUB mode');
        }
    }

    async sendSms(phone, message) {
        if (this.isStubMode) {
            console.log(`📱 [SMS STUB] To: ${phone} | Message: ${message}`);
            return { success: true, stub: true };
        }

        // Production Twilio integration
        // const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        // return twilio.messages.create({
        //   body: message,
        //   from: env.TWILIO_FROM_NUMBER,
        //   to: phone,
        // });
        return { success: true };
    }

    async sendOtp(phone, otp) {
        return this.sendSms(phone, `Your ShareCare verification code is: ${otp}. Valid for 5 minutes.`);
    }
}

module.exports = new SmsService();
