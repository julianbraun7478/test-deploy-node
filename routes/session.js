const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Personal Sessions
 *   description: API for managing personal coaching sessions
 */

/**
 * @swagger
 * /api/sessions/plans:
 *   get:
 *     summary: Get default or saved session plans
 *     tags: [Personal Sessions]
 *     responses:
 *       200:
 *         description: List of available session plans
 *       500:
 *         description: Server error
 */
router.get('/plans', sessionController.getPlans);

/**
 * @swagger
 * /api/sessions/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a session plan
 *     tags: [Personal Sessions]
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
 *     responses:
 *       200:
 *         description: Client secret returned for Stripe payment
 *       500:
 *         description: Server error
 */
router.post('/create-payment-intent', authenticateToken, sessionController.createPaymentIntent);

/**
 * @swagger
 * /api/sessions/confirm-purchase:
 *   post:
 *     summary: Confirm the purchase after Stripe payment
 *     tags: [Personal Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               planId:
 *                 type: string
 *               paymentIntentId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, apple_pay]
 *     responses:
 *       200:
 *         description: Purchase successful
 *       400:
 *         description: Payment not completed
 *       500:
 *         description: Purchase failed
 */
router.post('/confirm-purchase', authenticateToken, sessionController.confirmPurchase);

/**
 * @swagger
 * /api/sessions/book:
 *   post:
 *     summary: Book a session using remaining credits
 *     tags: [Personal Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               specialty:
 *                 type: string
 *                 enum: [Forex, Gold, Cryptos]
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *               mentor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session booked
 *       400:
 *         description: No available sessions
 *       500:
 *         description: Booking failed
 */
router.post('/book', authenticateToken, sessionController.bookSession);

/**
 * @swagger
 * /api/sessions/my-bookings:
 *   get:
 *     summary: Get all booked sessions for the authenticated user
 *     tags: [Personal Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of booked sessions
 *       500:
 *         description: Server error
 */
router.get('/my-bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await SessionBooking.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ bookings });
    } catch (error) {
        console.error('Retrieve Bookings Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/personal-sessions/mine:
 *   get:
 *     summary: Get purchased session plans for the authenticated user
 *     description: Retrieves all purchased personal session plans along with remaining sessions.
 *     tags: [Personal Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of session purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a2caff56ad4e84f2c8c8a3"
 *                       planId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64a2ca3f46ff6e842f56a8f1"
 *                           name:
 *                             type: string
 *                             example: "3 Session Pack"
 *                           price:
 *                             type: number
 *                             example: 299.00
 *                       sessionsRemaining:
 *                         type: integer
 *                         example: 2
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-08T14:30:00Z"
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve session purchases"
 */
router.get('/mine', authenticateToken, sessionController.getUserSessionPurchases);

module.exports = router;
