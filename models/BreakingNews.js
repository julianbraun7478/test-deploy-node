const mongoose = require('mongoose');

const breakingNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Forex', 'Gold', 'Cryptos', 'GoldPrice'],
    trim: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String, // Stored as Base64
    trim: true,
    default: ''
  }
});

module.exports = mongoose.model('BreakingNews', breakingNewsSchema);