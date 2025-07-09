const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Links to the user
  note: { type: String, required: true },
  feeling: { type: String, required: true }, // e.g., "happy", "sad", "neutral"
  timestamp: { type: Date, default: Date.now } // Last updated timestamp
});

module.exports = mongoose.model('Journal', journalSchema);