const mongoose = require('mongoose');
const sessionPurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionPlan', required: true },
    sessionsRemaining: { type: Number, required: true },
    paymentIntentId: { type: String },
    paymentMethod: { type: String, enum: ['card', 'apple_pay'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SessionPurchase', sessionPurchaseSchema);