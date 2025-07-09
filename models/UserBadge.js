const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'User' },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  assignedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserBadge', userBadgeSchema);