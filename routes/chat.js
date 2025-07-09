const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { askAI } = require('../services/openaiService');

// Louis Limited Custom Chat API
/**
 * @swagger
 * /api/chat/louis:
 *   post:
 *     summary: Send a message to Louis Limited Custom Chat
 *     description: Stores the message in MongoDB and broadcasts it via WebSocket. Triggers AI response if isAI is true.
 *     tags: [Chat API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *                 example: "user123"
 *               receiver:
 *                 type: string
 *                 example: "support"
 *               message:
 *                 type: string
 *                 example: "Hello, how can you assist me?"
 *               isAI:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       '200':
 *         description: Successful response with AI reply if isAI is true, otherwise success status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reply:
 *                   type: string
 *                   example: "I'm here to help!"
 *       '400':
 *         description: Bad request due to missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Sender, receiver, and message are required"
 */
router.post('/louis', async (req, res) => {
  const { sender, receiver, message, isAI } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: 'Sender, receiver, and message are required' });
  }

  const newMessage = new Chat({ sender, receiver, message, isAI });
  await newMessage.save();

  req.app.get('io').emit('newMessage', newMessage); // Broadcast via Socket.IO

  if (isAI) {
    const aiReply = await askAI(message);
    const aiMessage = new Chat({ sender: 'AI', receiver: sender, message: aiReply, isAI: true });
    await aiMessage.save();
    req.app.get('io').emit('newMessage', aiMessage); // Broadcast AI reply
    return res.json({ reply: aiReply });
  }

  res.status(200).json({ success: true });
});

// AI Chat API
/**
 * @swagger
 * /api/chat/ai:
 *   post:
 *     summary: Send a message to AI Chat using OpenAI
 *     description: Generates an AI response and broadcasts it via WebSocket.
 *     tags: [Chat API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What is the weather like today?"
 *               sender:
 *                 type: string
 *                 example: "user123"
 *               receiver:
 *                 type: string
 *                 example: "AI"
 *     responses:
 *       '200':
 *         description: Successful response with AI-generated reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "I'm not sure about the weather, but I can help with other questions!"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       '400':
 *         description: Bad request due to missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Message, sender, and receiver are required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch AI response"
 */
router.post('/ai', async (req, res) => {
  const { message, sender, receiver } = req.body;

  if (!message || !sender || !receiver) {
    return res.status(400).json({ error: 'Message, sender, and receiver are required' });
  }

  try {
    const aiReply = await askAI(message);
    const aiMessage = new Chat({ sender: 'AI', receiver: sender, message: aiReply, isAI: true });
    await aiMessage.save();
    req.app.get('io').emit('newMessage', aiMessage); // Broadcast AI reply
    res.json({ message: aiReply, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI response' });
  }
});

module.exports = router;