const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  criteria: {
    completing10Trades: { type: Boolean, default: false },
    achieving80Accuracy: { type: Boolean, default: false }
  },
  category: {
    type: String,
    enum: ['Trading', 'Forex', 'Crypto', 'Engagement', 'Education'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);