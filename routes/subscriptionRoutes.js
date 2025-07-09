const express = require('express');
const router = express.Router();
const {
  getSubscriptionPlans,
  createPaymentIntent,
  confirmSubscription,
  getUserSubscription
} = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');
/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: API for managing user subscriptions
 */

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get default or saved subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of available subscription plans
 *       500:
 *         description: Server error
 */
router.get('/plans', getSubscriptionPlans);

/**
 * @swagger
 * /api/subscriptions/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, apple_pay]
 *     responses:
 *       200:
 *         description: Client secret returned for Stripe payment
 *       500:
 *         description: Server error
 */
router.post('/create-payment-intent', authenticateToken, createPaymentIntent);

/**
 * @swagger
 * /api/subscriptions/confirm-subscription:
 *   post:
 *     summary: Confirm the subscription after Stripe payment
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               paymentIntentId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, apple_pay]
 *     responses:
 *       200:
 *         description: Subscription confirmed successfully
 *       400:
 *         description: Payment not completed
 *       500:
 *         description: Subscription confirmation failed
 */
router.post('/confirm-subscription', authenticateToken, confirmSubscription);

/**
 * @swagger
 * /api/subscriptions/status:
 *   get:
 *     summary: Get subscription status for the authenticated user
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/status', authenticateToken, getUserSubscription);

module.exports = router;

