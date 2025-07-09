const express = require('express');
const router = express.Router();
const TradingTip = require('../models/TradingTip');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your JWT token in the format "Bearer <token>". The userId (e.g., "user123") is extracted from the token.
 *   schemas:
 *     TradingTip:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "user123"
 *         title:
 *           type: string
 *           example: "Best Stock Picks for 2025"
 *         content:
 *           type: string
 *           example: "Focus on tech stocks like AAPL and MSFT..."
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-07-04T05:54:00Z"
 *
 * /api/trading-tips:
 *   get:
 *     summary: Get all trading tips for the authenticated user
 *     description: Retrieves a list of all trading tips for the authenticated user.
 *     tags: [Trading Tips API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of trading tips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TradingTip'
 *       '401':
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve trading tips"
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tips = await TradingTip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ tips });
  } catch (error) {
    console.error('TradingTip Error:', error);
    res.status(500).json({ error: 'Failed to retrieve trading tips' });
  }
});

/**
 * @swagger
 * /api/trading-tips:
 *   post:
 *     summary: Create a new trading tip for the authenticated user
 *     description: Allows the authenticated user to create a new trading tip. User ID is derived from the authentication token.
 *     tags: [Trading Tips API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Best Stock Picks for 2025"
 *               content:
 *                 type: string
 *                 example: "Focus on tech stocks like AAPL and MSFT..."
 *     responses:
 *       '201':
 *         description: Trading tip created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Trading tip created successfully"
 *                 tip:
 *                   $ref: '#/components/schemas/TradingTip'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "title and content are required"
 *       '401':
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create trading tip"
 */
router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  try {
    const tip = new TradingTip({ userId, title, content });
    await tip.save();

    const io = req.app.get('io');
    io.emit('newTradingTip', tip); // Broadcast to all connected clients

    res.status(201).json({ message: 'Trading tip created successfully', tip });
  } catch (error) {
    console.error('TradingTip Error:', error);
    res.status(500).json({ error: 'Failed to create trading tip' });
  }
});

module.exports = router;