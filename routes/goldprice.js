const express = require('express');
const router = express.Router();
const GoldPriceAlert = require('../models/GoldPriceAlert');
const axios = require('axios');
require('dotenv').config();
const { authenticateToken } = require('../middleware/auth');

// Function to fetch live XAU/USD price using goldapi.com
async function getLiveGoldPrice() {
  try {
    const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': process.env.GOLD_API_KEY }
    });
    return response.data.price;
  } catch (error) {
    console.error('Error fetching live gold price from goldapi.com:', error);
    return null;
  }
}

// Get all alerts
/**
 * @swagger
 * /api/goldprice/alerts:
 *   get:
 *     summary: Fetch all gold price alerts for the authenticated user
 *     description: Retrieves all currently active price alerts for the authenticated user from MongoDB. Notifications are triggered when alerts are added or updated if the price approaches the target.
 *     tags: [Gold Price API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful response with active alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6862e58aedfe6f3d3e707ee0"
 *                       target:
 *                         type: number
 *                         example: 3300.00
 *                       userId:
 *                         type: string
 *                         example: "user123"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-25T08:18:00Z"
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
 *                   example: "Failed to fetch alerts"
 */
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await GoldPriceAlert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ alerts });
  } catch (error) {
    console.error('Alerts Error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Add a new alert
/**
 * @swagger
 * /api/goldprice/alert:
 *   post:
 *     summary: Add a gold price alert for the authenticated user
 *     description: Adds a new alert to MongoDB for the authenticated user. Checks live XAU/USD price from goldapi.com and triggers a notification if the price is approaching the target. User ID is derived from the authentication token.
 *     tags: [Gold Price API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target:
 *                 type: number
 *                 example: 3300.00
 *     responses:
 *       '200':
 *         description: Alert added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Alert added successfully"
 *                 _id:
 *                   type: string
 *                   example: "6862e58aedfe6f3d3e707ee0"
 *       '400':
 *         description: Bad request due to invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Target is required"
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
 */
router.post('/alert', authenticateToken, async (req, res) => {
  const { target } = req.body;
  const userId = req.user.id;
  console.log(userId);
  if (!target || isNaN(target)) {
    return res.status(401).json({ error: 'Target is required' });
  }
  
  try {
    const newAlert = new GoldPriceAlert({ target, userId });
    await newAlert.save();

    const livePrice = await getLiveGoldPrice();
    if (livePrice) {
      const threshold = target * 0.01; // 1% threshold for "approaching"
      if (Math.abs(livePrice - target) <= threshold) {
        const notificationUrl = `${req.protocol}://${req.get('host')}/api/notifications/email`;
        await axios.post(notificationUrl, {
          title: 'Gold Price Alert',
          message: `Gold is approaching ${target} (Live price: ${livePrice})`,
          userId,
          type: 'Alert'
        });
        console.log(`Notification sent for approaching price: ${target} for user ${userId}`);
      }
    }

    res.json({ message: 'Alert added successfully', _id: newAlert._id });
  } catch (error) {
    console.error('Add Alert Error:', error);
    res.status(500).json({ error: 'Failed to add alert' });
  }
});

// Edit an existing alert
/**
 * @swagger
 * /api/goldprice/alert/{id}:
 *   put:
 *     summary: Edit a gold price alert for the authenticated user
 *     description: Updates an existing alert in MongoDB with a new target for the authenticated user. Checks live XAU/USD price from goldapi.com and triggers a notification if the price is approaching the new target.
 *     tags: [Gold Price API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "6862e58aedfe6f3d3e707ee0"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target:
 *                 type: number
 *                 example: 3350.00
 *     responses:
 *       '200':
 *         description: Alert updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Alert with ID 6862e58aedfe6f3d3e707ee0 updated"
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
 *       '404':
 *         description: Alert not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Alert not found"
 */
router.put('/alert/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { target } = req.body;
  const userId = req.user.id;
  if (!target || isNaN(target)) {
    return res.status(401).json({ error: 'Target is required' });
  }
  try {
    const alert = await GoldPriceAlert.findOneAndUpdate(
      { _id: id, userId },
      { target },
      { new: true, runValidators: true }
    );
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const livePrice = await getLiveGoldPrice();
    if (livePrice) {
      const threshold = target * 0.01;
      if (Math.abs(livePrice - target) <= threshold) {
        const notificationUrl = `${req.protocol}://${req.get('host')}/api/notifications/email`;
        await axios.post(notificationUrl, {
          title: 'Gold Price Alert',
          message: `Gold is approaching ${target} (Live price: ${livePrice})`,
          userId,
          type: 'Alert'
        });
        console.log(`Notification sent for approaching price: ${target} for user ${userId}`);
      }
    }

    res.json({ message: `Alert with ID ${id} updated` });
  } catch (error) {
    console.error('Edit Alert Error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert
/**
 * @swagger
 * /api/goldprice/alert/{id}:
 *   delete:
 *     summary: Delete a gold price alert for the authenticated user
 *     description: Removes an existing alert from MongoDB by ID for the authenticated user, stopping any further notifications for that alert.
 *     tags: [Gold Price API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "6862e58aedfe6f3d3e707ee0"
 *     responses:
 *       '200':
 *         description: Alert deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Alert with ID 6862e58aedfe6f3d3e707ee0 deleted"
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
 *       '404':
 *         description: Alert not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Alert not found"
 */
router.delete('/alert/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const alert = await GoldPriceAlert.findOneAndDelete({ _id: id, userId });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ message: `Alert with ID ${id} deleted` });
  } catch (error) {
    console.error('Delete Alert Error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

module.exports = router;