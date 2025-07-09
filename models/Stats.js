const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  isCustom: { type: Boolean, default: false }, // Differentiates default vs custom metrics
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
statsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Stats', statsSchema);