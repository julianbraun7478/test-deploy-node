require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const SessionPlan = require('../models/SessionPlan');
const SessionPurchase = require('../models/SessionPurchase');
const SessionBooking = require('../models/SessionBooking');

const defaultPlans = [
    { name: '1 session', price: 299, sessionsIncluded: 1, description: 'One personal session tailored to your needs.' },
    { name: '3 sessions', price: 499, sessionsIncluded: 3, description: 'Three personal sessions tailored to your needs.' }
];

exports.getPlans = async (req, res) => {
    try {
        let plans = await SessionPlan.find({});
        if (plans.length === 0) {
            plans = await SessionPlan.insertMany(defaultPlans);
        }
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: 'Error loading plans' });
    }
};

exports.createPaymentIntent = async (req, res) => {
    const { planId } = req.body;
    try {
        const plan = await SessionPlan.findById(planId);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: plan.price * 100,
            currency: 'usd',
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: 'Payment intent error' });
    }
};

exports.confirmPurchase = async (req, res) => {
    const { planId, paymentIntentId, paymentMethod } = req.body;
    const userId = req.user.id;
    try {
        const plan = await SessionPlan.findById(planId);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not completed.' });
        }

        const purchase = new SessionPurchase({
            userId,
            planId,
            sessionsRemaining: plan.sessionsIncluded,
            paymentIntentId,
            paymentMethod
        });

        await purchase.save();
        res.json({ message: 'Purchase successful', purchase });
    } catch (err) {
        res.status(500).json({ error: 'Purchase failed' });
    }
};

exports.bookSession = async (req, res) => {
    const { specialty, date, time, mentor } = req.body;
    const userId = req.user.id;

    try {
        const purchase = await SessionPurchase.findOne({ userId, sessionsRemaining: { $gt: 0 } }).sort({ createdAt: -1 });
        if (!purchase) return res.status(400).json({ error: 'No available sessions' });

        const booking = new SessionBooking({
            userId,
            purchaseId: purchase._id,
            specialty,
            date,
            time,
            mentor
        });

        purchase.sessionsRemaining -= 1;
        await booking.save();
        await purchase.save();

        res.json({ message: 'Session booked', booking });
    } catch (err) {
        res.status(500).json({ error: 'Booking failed' });
    }
};

exports.getUserSessionPurchases = async (req, res) => {
    try {
        const userId = req.user.id;

        const purchases = await SessionPurchase.find({ userId })
            .populate('planId')
            .sort({ createdAt: -1 });

        res.json({ purchases });
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        res.status(500).json({ error: 'Failed to retrieve session purchases' });
    }
};
