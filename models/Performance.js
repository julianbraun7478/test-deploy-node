const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  totalProfitLoss: { type: Number, default: 0 },
  tradeCount: { type: Number, default: 0 },
  historicalData: [{
    signalId: { type: String, required: true },
    date: { type: Date, required: true },
    profitLoss: { type: Number, required: true },
    pipMovement: { type: String, required: true }
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Performance', performanceSchema);