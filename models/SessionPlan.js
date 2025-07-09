const mongoose = require('mongoose');

const sessionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },        // "1 session", "3 sessions"
  price: { type: Number, required: true },        // 299, 499
  sessionsIncluded: { type: Number, required: true },  // 1 or 3
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SessionPlan', sessionPlanSchema);