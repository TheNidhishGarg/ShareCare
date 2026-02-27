const { Server } = require('socket.io');
const { env } = require('./env');

let io = null;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: env.FRONTEND_URL,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
    });

    console.log('✅ Socket.IO initialized');
    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized — call initSocket first');
    }
    return io;
}

module.exports = { initSocket, getIO };
