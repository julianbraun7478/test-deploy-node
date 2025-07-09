const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { 
    type: String, 
    required: true 
  },
  type: { type: String, default: 'Normal' }, // Any string allowed
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  scheduleDate: { type: Date } // Optional scheduling date
});

module.exports = mongoose.model('Notification', notificationSchema);