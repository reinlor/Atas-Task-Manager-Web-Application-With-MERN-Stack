const Notification = require('../models/notificationModel');
const { getIO } = require('../config/socket'); 

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