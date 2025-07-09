const mongoose = require('mongoose');

const goldPriceAlertSchema = new mongoose.Schema({
  target: { type: Number, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GoldPriceAlert', goldPriceAlertSchema);