const Notification = require('../models/notificationModel'); // Adjust path if needed
const { getJson, setJson, invalidateUserCaches } = require('../services/cacheService');

// Controller function to retrive user notifications
exports.getNotification = async (req, res) => {
  console.log('notif id: ', req.user.id)
  try {
    const cacheKey = `notifications:${req.user.id}`;
    const cachedNotifications = await getJson(cacheKey);
    if (cachedNotifications) return res.status(200).json(cachedNotifications);

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    await setJson(cacheKey, notifications, 60);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller function to set notif as marked/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    await invalidateUserCaches(req.user.id);
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller function to set all notif of the user as Read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    await invalidateUserCaches(req.user.id);
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};