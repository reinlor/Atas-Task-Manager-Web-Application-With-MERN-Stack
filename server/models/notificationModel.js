const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    text: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
    createdAt: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
})

module.exports = mongoose.model('Notification', notificationSchema);