const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /api/economic-calendar:
 *   get:
 *     summary: Retrieve economic calendar events for US
 *     description: Fetches US economic calendar events using Trading Economics API, including importance, actual, forecast, previous, and date, with week range support.
 *     tags: [Economic Calendar API]
 *     parameters:
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-27"
 *       - name: period
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Yesterday, Today, Tomorrow, Week]
 *           example: "Week"
 *     responses:
 *       '200':
 *         description: Successful response with economic calendar events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EconomicEvent'
 *       '400':
 *         description: Bad request due to invalid date or period
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid date or period"
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error fetching economic calendar"
 */
router.get('/', async (req, res) => {
  try {
    const { date, period } = req.query;
    const now = new Date('2025-06-27T08:40:00-07:00'); // Current time: 08:40 AM PDT, June 27, 2025
    let startDate, endDate;

    if (date) {
      startDate = new Date(date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Week ends 6 days later
    } else if (period) {
      if (!['Yesterday', 'Today', 'Tomorrow', 'Week'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period' });
      }
      const baseDate = new Date(now);
      if (period === 'Yesterday') {
        startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
      } else if (period === 'Today') {
        startDate = new Date(baseDate);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (period === 'Tomorrow') {
        startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      } else if (period === 'Week') {
        startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)
      }
    } else {
      startDate = new Date(now);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    // Trading Economics API call for US events with date range
    const apiKey = 'be654023d5b84e5:njoqgnliqats4od'; // Replace with your actual API key
    const response = await axios.get(`https://api.tradingeconomics.com/calendar/country/All/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`, {
      params: {
        c: apiKey,
        f: 'json'
      }
    });

    const events = response.data
      .map(event => ({
        event: event.Event,
        importance: event.Importance,
        actual: event.Actual || 'N/A',
        forecast: event.Forecast || 'N/A',
        previous: event.Previous || 'N/A',
        country: event.Country,
        currency: event.Currency,
        date: event.Date
      }));

    res.json({ events });
  } catch (error) {
    console.error('Economic Calendar Error:', error);
    res.status(500).json({ error: 'Error fetching economic calendar' });
  }
});

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     EconomicEvent:
 *       type: object
 *       properties:
 *         event:
 *           type: string
 *           example: "US Nonfarm Payrolls"
 *         importance:
 *           type: string
 *           example: "High"
 *         actual:
 *           type: string
 *           example: "250K"
 *         forecast:
 *           type: string
 *           example: "240K"
 *         previous:
 *           type: string
 *           example: "230K"
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2025-06-27T08:30:00-07:00"
 */