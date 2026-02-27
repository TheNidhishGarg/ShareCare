const jwt = require('jsonwebtoken');
const ngeohash = require('ngeohash');
const { env } = require('../config/env');

function setupSocketHandlers(io) {
    // Auth middleware for Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.userId}`);

        // Join user-specific room
        socket.join(`user_${socket.userId}`);

        // Join geohash room for nearby listing notifications
        socket.on('join-geo', ({ lat, lng }) => {
            if (lat && lng) {
                const geohash = ngeohash.encode(lat, lng, 5);
                socket.join(`geo_${geohash}`);
                console.log(`📍 User ${socket.userId} joined geo room: ${geohash}`);
            }
        });

        socket.on('leave-geo', ({ geohash }) => {
            if (geohash) {
                socket.leave(`geo_${geohash}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userId}`);
        });
    });

    console.log('✅ Socket.IO handlers registered');
}

module.exports = { setupSocketHandlers };
