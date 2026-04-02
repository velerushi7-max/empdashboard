const { db } = require('../db');

const notificationController = {
    // 🔔 Get Notifications for User
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await db.execute({
                sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
                args: [userId]
            });
            res.json(result.rows);
        } catch (error) {
            console.error('getNotifications error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    // ✅ Mark as Read
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            await db.execute({
                sql: "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
                args: [id, userId]
            });
            
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            console.error('markAsRead error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    // ✅ Mark All as Read
    markAllAsRead: async (req, res) => {
        try {
            const userId = req.user.id;
            await db.execute({
                sql: "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
                args: [userId]
            });
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            console.error('markAllAsRead error:', error);
            res.status(500).json({ message: 'Database error' });
        }
    },

    // 🔥 Helper for other controllers
    create: async (userId, type, title, message, io = null) => {
        try {
            const result = await db.execute({
                sql: "INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, 0)",
                args: [userId, type, title, message]
            });

            const newId = Number(result.lastInsertRowid);

            // If socket.io is available, emit real-time notification
            if (io) {
                // Emit to a specific room for this user
                io.emit(`notification_${userId}`, {
                    id: newId,
                    type,
                    title,
                    message,
                    created_at: new Date().toISOString(),
                    is_read: 0
                });
            }
            return true;
        } catch (error) {
            console.error('Notify Error:', error);
            return false;
        }
    }
};

module.exports = notificationController;
