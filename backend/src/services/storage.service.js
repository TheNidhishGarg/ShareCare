const { env } = require('../config/env');
const crypto = require('crypto');

class StorageService {
    constructor() {
        this.isStubMode = !env.AWS_ACCESS_KEY_ID;
        if (this.isStubMode) {
            console.log('📦 Storage service running in STUB mode');
        }
    }

    // Generate presigned upload URL
    async getPresignedUploadUrl(fileName, contentType) {
        if (this.isStubMode) {
            const fakeKey = `uploads/${Date.now()}_${fileName}`;
            return {
                uploadUrl: `http://localhost:${env.PORT}/api/v1/media/upload`,
                key: fakeKey,
                publicUrl: `http://localhost:${env.PORT}/uploads/${fakeKey}`,
            };
        }

        // Production: AWS S3 presigned URL
        // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        // const s3 = new S3Client({ region: env.AWS_REGION });
        // const key = `uploads/${Date.now()}_${crypto.randomUUID()}_${fileName}`;
        // const command = new PutObjectCommand({
        //   Bucket: env.AWS_S3_BUCKET,
        //   Key: key,
        //   ContentType: contentType,
        // });
        // const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        // const publicUrl = env.AWS_CLOUDFRONT_DOMAIN
        //   ? `https://${env.AWS_CLOUDFRONT_DOMAIN}/${key}`
        //   : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
        // return { uploadUrl, key, publicUrl };
        return { uploadUrl: '', key: '', publicUrl: '' };
    }
}

module.exports = new StorageService();
