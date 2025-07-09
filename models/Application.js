const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    default: 1
  },
  userId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telegramId: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  currentlyWorking: {
    type: String,
    enum: ['Yes, as an employee', 'Yes, I own a business', 'No, I\'m currently not working'],
    required: true
  },
  tradingExperience: {
    type: String,
    enum: ['Beginner (0-2 years)', 'Intermediate (3-5 years)', 'Expert (5 years+)'],
    required: true
  },
  profitableTrader: {
    type: String,
    required: true
  },
  joinedLLPackage: {
    type: String,
    required: true
  },
  tradingBroker: {
    type: String,
    required: true
  },
  activeTrader: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  followSignalGroups: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  accountBalance: {
    type: String,
    enum: ['Below 1k USD', '1-5k USD', '5-10k USD', '10k USD and above', 'I\'m not an active Trader on my real account'],
    required: true
  },
  risk1kUSD: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  invest1kUSD: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  hardWorker: {
    type: String,
    enum: ['Yes', 'No', 'Depends on what'],
    required: true
  },
  joinReason: {
    type: String,
    required: true
  },
  extraMile: {
    type: String,
    required: true
  },
  feedbackWillingness: {
    type: String,
    enum: ['Not Willing at all', 'More no than yes', 'More yes than no', 'Very Willing'],
    required: true
  },
  selfieBase64: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', applicationSchema);