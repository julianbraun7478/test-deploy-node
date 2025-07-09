const { SubscriptionPlan, Subscription } = require('../models/Subscription');
require('dotenv').config();
const User = require('../models/User');

// Predefined Subscription Plans
const defaultPlans = [
  { name: 'Plan Cadet', price: 35.99, interval: 'month' },
  { name: 'First Officer', price: 299.99, interval: 'year' }
];

// Get or Initialize Subscription Plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find();
    if (plans.length === 0) {
      plans = await SubscriptionPlan.insertMany(defaultPlans);
    }
    console.log(plans);

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create Stripe Payment Intent
exports.createPaymentIntent = async (req, res) => {
  const { planId } = req.body;
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe Secret Key

  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found.' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'usd',
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Confirm Subscription After Payment
exports.confirmSubscription = async (req, res) => {
  const { planId, paymentMethod, paymentIntentId } = req.body;
  const userId = req.user.id;
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe Secret Key
  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found.' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed.' });
    }

    const startDate = new Date();
    const endDate = new Date();
    if (plan.interval === 'month') endDate.setMonth(endDate.getMonth() + 1);
    else if (plan.interval === 'year') endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = new Subscription({
      userId,
      planId,
      paymentMethod,
      stripeSubscriptionId: paymentIntentId,
      startDate,
      endDate
    });

    await subscription.save();

    await User.findByIdAndUpdate(userId, { role: 'premium' });

    res.json({ message: 'Subscription confirmed successfully', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User Subscription Status
exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ userId, status: 'active' }).populate('planId');

    if (!subscription) return res.json({ status: 'No active subscription' });

    res.json({
      status: subscription.status,
      plan: subscription.planId.name,
      expiresAt: subscription.endDate
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
