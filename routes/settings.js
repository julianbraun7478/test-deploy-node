const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieves the settings for the authenticated user, including community sharing status.
 *     tags: [Settings API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 communitySharing:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       '401':
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       '404':
 *         description: Settings not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Settings not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve settings"
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await Settings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(settings);
  } catch (error) {
    console.error('Settings Error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update user settings
 *     description: Updates the settings for the authenticated user, currently supporting community sharing toggle.
 *     tags: [Settings API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communitySharing:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       '200':
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Settings updated successfully"
 *                 settings:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     communitySharing:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid communitySharing value"
 *       '401':
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       '404':
 *         description: Settings not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Settings not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update settings"
 */
router.put('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { communitySharing } = req.body;

  if (communitySharing === undefined || typeof communitySharing !== 'boolean') {
    return res.status(400).json({ error: 'Invalid communitySharing value' });
  }

  try {
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = new Settings({ userId });
    }
    settings.communitySharing = communitySharing;
    await settings.save();

    const io = req.app.get('io');
    io.to(userId).emit('updateSettings', { communitySharing: settings.communitySharing }); // Real-time update

    res.json({ message: 'Settings updated successfully', settings: { userId: settings.userId, communitySharing: settings.communitySharing, updatedAt: settings.updatedAt } });
  } catch (error) {
    console.error('Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;