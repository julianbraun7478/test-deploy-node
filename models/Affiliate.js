const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to User
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: 'AffiliateTier', required: true }, // Link to tier
  referralCount: { type: Number, default: 0 },
  totalRewards: { type: Number, default: 0 }, // Total rewards earned in currency
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
affiliateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Affiliate', affiliateSchema);