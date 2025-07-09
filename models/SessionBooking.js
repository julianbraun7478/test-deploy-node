const mongoose = require('mongoose');
const sessionBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionPurchase', required: true },
    specialty: { type: String, enum: ['Forex', 'Gold', 'Cryptos'], required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    mentor: { type: String, required: true },
    status: { type: String, enum: ['booked'], default: 'booked' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SessionBooking', sessionBookingSchema);