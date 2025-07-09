const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  interval: { type: String, enum: ['month', 'year'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  paymentMethod: { type: String, enum: ['apple_pay', 'card'], required: true },
  stripeSubscriptionId: { type: String } // To store Stripe subscription ID
});

module.exports = {
  SubscriptionPlan: mongoose.model('SubscriptionPlan', subscriptionPlanSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema)
};