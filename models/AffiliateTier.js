const mongoose = require('mongoose');

const affiliateTierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true}, // Restrict to existing tiers
  commissionType: { type: String, required: true, enum: ['percent', 'fixed'], default: 'percent' }, // Percent or Fixed by Referral
  commissionRate: { type: Number, required: true }, // Enter Percent or Fixed amount
  minReferrals: { type: Number, required: true }, // Minimal Referrals
  revenusGenerated: { type: Number, default: 0 }, // Revenus Generated (can be updated by admin or calculated)
  bonusPoints: { type: Boolean, default: false }, // Checkbox: Enable/Disable Bonus Points
  specialBadges: { type: Boolean, default: false }, // Checkbox: Enable/Disable Special Badges
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update updatedAt on save
affiliateTierSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AffiliateTier', affiliateTierSchema);