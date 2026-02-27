const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storageService = require('../services/storage.service');
const { authMiddleware } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for local dev uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WEBP images are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/v1/media/presign — Get presigned upload URL
router.post('/presign', authMiddleware, uploadLimiter, async (req, res, next) => {
    try {
        const { fileName, contentType } = req.body;
        const result = await storageService.getPresignedUploadUrl(fileName, contentType);
        res.json({ success: true, data: result, error: null, meta: {} });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/media/upload — Direct upload (dev mode)
router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, data: null, error: 'No file provided', meta: {} });
        }

        const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({
            success: true,
            data: { url: publicUrl, filename: req.file.filename },
            error: null,
            meta: {},
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
