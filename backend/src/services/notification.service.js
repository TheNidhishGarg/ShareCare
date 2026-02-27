const { prisma } = require('../config/prisma');

class NotificationService {
    // Create in-app notification
    async create({ userId, type, title, body, data }) {
        return prisma.notification.create({
            data: { userId, type, title, body, data },
        });
    }

    // Get user notifications
    async getUserNotifications(userId, limit = 50) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Mark single as read
    async markAsRead(id, userId) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    // Mark all as read
    async markAllAsRead(userId) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    // Get unread count
    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
}

module.exports = new NotificationService();
