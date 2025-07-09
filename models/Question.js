const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  text: { type: String, required: true },
  trueOption: { type: String, required: true }, // Single true option
  falseOptions: [{ type: String, required: true }], // Array of at least 2 false options
  photo: { type: String }, // URL for uploaded photo
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
questionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Question', questionSchema);