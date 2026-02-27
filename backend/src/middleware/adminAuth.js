function adminAuth(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            data: null,
            error: 'Admin access required',
            meta: {},
        });
    }
    next();
}

module.exports = { adminAuth };
