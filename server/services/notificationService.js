const Notification = require('../models/notificationModel'); //[cite: 3]
const { getIO } = require('../config/socket'); //[cite: 2]

exports.createAndEmitNotification = async ({ userId, type, text }) => {
  try {
    // Save notification directly to mongoDB
    const notification = await Notification.create({
      userId,
      type,
      text,
      read: false
    });

    //Emit realtme event directly to targeted socket room
    getIO().to(userId.toString()).emit('new_notification', notification);

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};