const mongoose = require('mongoose');

const tradingTipSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Links to the user who created the tip
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
tradingTipSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TradingTip', tradingTipSchema);