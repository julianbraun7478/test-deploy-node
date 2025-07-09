const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  signalId: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  asset: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  stopLoss: { type: Number, required: true },
  takeProfit: { type: Number, required: true },
  reasoning: { type: String },
  entryType: { type: String, enum: ['Buy', 'Sell', 'Buy limit', 'Sell limit'], required: true },
  category: { type: String, enum: ['All users', 'Premium users', 'Free users'], default: 'Premium users' },
  publishTiming: { type: String, enum: ['Immediate Publish', 'Scheduled Publish'], default: 'Immediate Publish' },
  publishDate: { type: Date },
  publishTime: { type: String },
  status: { type: String, enum: ['Published', 'Scheduled'], default: 'Scheduled' }
});

module.exports = mongoose.model('Signal', signalSchema);