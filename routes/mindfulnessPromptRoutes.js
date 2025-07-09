const express = require('express');
const router = express.Router();
const MindfulnessPrompt = require('../models/MindfulnessPrompt');
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
 *     MindfulnessPrompt:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "user123"
 *         title:
 *           type: string
 *           example: "Stay Calm During Trades"
 *         content:
 *           type: string
 *           example: "Take a deep breath and focus on the present..."
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-07-04T05:42:00Z"
 *
 * /api/mindfulness-prompts:
 *   get:
 *     summary: Get all mindfulness prompts for the authenticated user
 *     description: Retrieves a list of all mindfulness prompts for the authenticated user.
 *     tags: [Mindfulness Prompts API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of mindfulness prompts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prompts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MindfulnessPrompt'
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
 *                   example: "Failed to retrieve mindfulness prompts"
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const prompts = await MindfulnessPrompt.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json({ prompts });
  } catch (error) {
    console.error('MindfulnessPrompt Error:', error);
    res.status(500).json({ error: 'Failed to retrieve mindfulness prompts' });
  }
});

/**
 * @swagger
 * /api/mindfulness-prompts:
 *   post:
 *     summary: Create a new mindfulness prompt for the authenticated user
 *     description: Allows the authenticated user to create a new mindfulness prompt. User ID is derived from the authentication token.
 *     tags: [Mindfulness Prompts API]
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
 *                 example: "Stay Calm During Trades"
 *               content:
 *                 type: string
 *                 example: "Take a deep breath and focus on the present..."
 *     responses:
 *       '201':
 *         description: Mindfulness prompt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mindfulness prompt created successfully"
 *                 prompt:
 *                   $ref: '#/components/schemas/MindfulnessPrompt'
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
 *                   example: "Failed to create mindfulness prompt"
 */
router.post('/', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  try {
    const prompt = new MindfulnessPrompt({ userId, title, content });
    await prompt.save();

    const io = req.app.get('io');
    io.emit('newMindfulnessPrompt', prompt); // Broadcast to all connected clients

    res.status(201).json({ message: 'Mindfulness prompt created successfully', prompt });
  } catch (error) {
    console.error('MindfulnessPrompt Error:', error);
    res.status(500).json({ error: 'Failed to create mindfulness prompt' });
  }
});

module.exports = router;