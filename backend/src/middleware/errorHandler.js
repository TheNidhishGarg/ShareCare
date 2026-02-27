function errorHandler(err, req, res, next) {
    console.error('❌ Unhandled error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        data: null,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
        meta: process.env.NODE_ENV === 'production' ? {} : { stack: err.stack },
    });
}

class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}

module.exports = { errorHandler, AppError };
