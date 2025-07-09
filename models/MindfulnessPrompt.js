const mongoose = require('mongoose');

const mindfulnessPromptSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Links to the user who created the prompt
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
mindfulnessPromptSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MindfulnessPrompt', mindfulnessPromptSchema);