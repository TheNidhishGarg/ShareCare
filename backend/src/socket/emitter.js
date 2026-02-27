let io = null;

function setIO(ioInstance) {
    io = ioInstance;
}

function emitToUser(userId, event, data) {
    if (!io) return;
    io.to(`user_${userId}`).emit(event, data);
}

function emitToGeoRoom(geohash, event, data) {
    if (!io) return;
    io.to(`geo_${geohash}`).emit(event, data);
}

module.exports = { setIO, emitToUser, emitToGeoRoom };
