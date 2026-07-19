const db = require('../db/db');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const [notifs] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.user_id]
    );
    const [unread] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.user_id]
    );
    return res.json({ success: true, notifications: notifs, unread_count: unread[0].count });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE notif_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    return res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.user_id]
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getNotifications, markAsRead, markAllRead };
