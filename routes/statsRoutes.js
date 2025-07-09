const express = require('express');
require('dotenv').config();
const router = express.Router();
const Stats = require('../models/Stats');
const User = require('../models/User'); // Import User model
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

// MT5 Flask service URL
const MT5_SERVICE_URL = process.env.PYTHON_SERVER_URL;

// Helper function to fetch and save MT5 metrics for the authenticated user
async function fetchAndSaveMT5Metrics(userId) {
  try {
    // Fetch user data to get MT5 credentials
    const user = await User.findById(userId).select('mt5Login mt5Password mt5Server');
    if (!user || !user.mt5Login || !user.mt5Password || !user.mt5Server) {
      throw new Error('MT5 credentials not found or incomplete');
    }

    const credentials = {
      login: user.mt5Login,
      password: user.mt5Password,
      server: user.mt5Server,
    };

    const response = await axios.post(`${MT5_SERVICE_URL}/connect`, credentials);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    const { metrics } = response.data;
    const allMetrics = [...metrics.default, ...metrics.custom];

    // Clear existing metrics for this user and insert new ones
    await Stats.deleteMany({ userId });
    const newMetrics = allMetrics.map(metric => ({
      ...metric,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await Stats.insertMany(newMetrics);

    return newMetrics;
  } catch (error) {
    console.error('MT5 Fetch Error:', error.message);
    throw error;
  }
}

/**
 * @swagger
 * /api/stats/default:
 *   get:
 *     summary: Get all default metrics
 *     description: Retrieves a list of default metrics fetched from MT5 account for the authenticated user.
 *     tags: [Stats API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of default metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stats'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve default metrics"
 */
router.get('/default', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('mt5Login mt5Password mt5Server');
    if (!user || !user.mt5Login || !user.mt5Password || !user.mt5Server) {
      throw new Error('MT5 credentials not found or incomplete');
    }

    const credentials = {
      login: user.mt5Login,
      password: user.mt5Password,
      server: user.mt5Server,
    };

    const response = await axios.post(`${MT5_SERVICE_URL}/connect`, credentials);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    const { metrics } = response.data;
    // const metrics = await Stats.find({ userId: req.user.id, isCustom: false }).sort({ createdAt: -1 });
    res.json({ default: metrics.default });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve default metrics' });
  }
});

/**
 * @swagger
 * /api/stats/custom:
 *   get:
 *     summary: Get all custom metrics
 *     description: Retrieves a list of custom metrics calculated from MT5 data for the authenticated user.
 *     tags: [Stats API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of custom metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Stats'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve custom metrics"
 */
router.get('/custom', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('mt5Login mt5Password mt5Server');
    if (!user || !user.mt5Login || !user.mt5Password || !user.mt5Server) {
      throw new Error('MT5 credentials not found or incomplete');
    }

    const credentials = {
      login: user.mt5Login,
      password: user.mt5Password,
      server: user.mt5Server,
    };

    const response = await axios.post(`${MT5_SERVICE_URL}/connect`, credentials);
    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    const { metrics } = response.data;
    // const metrics = await Stats.find({ userId: req.user.id, isCustom: false }).sort({ createdAt: -1 });
    res.json({ custom: metrics.custom });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to retrieve custom metrics' });
  }
});

module.exports = router;