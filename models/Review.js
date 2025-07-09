const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: { type: String, enum: ['Lovely', 'Amazing', 'Wonderful'], required: true },
  reviewText: { type: String, required: true },
  images: [{ type: String }], // Now stores Base64 strings
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', reviewSchema);