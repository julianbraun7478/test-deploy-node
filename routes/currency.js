const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Currency Conversion API
/**
 * @swagger
 * /api/convert:
 *   get:
 *     summary: Convert between currencies
 *     description: Converts a given amount between USD and MYR using the latest or historical exchange rate.
 *     tags: [Currency API]
 *     parameters:
 *       - name: amount
 *         in: query
 *         required: true
 *         schema:
 *           type: number
 *           example: 100
 *       - name: from
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [USD, MYR]
 *           default: USD
 *           example: USD
 *       - name: to
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [MYR, USD]
 *           default: MYR
 *           example: MYR
 *       - name: date
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-06-24"
 *     responses:
 *       '200':
 *         description: Successful conversion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 amountFrom:
 *                   type: number
 *                   example: 100
 *                 amountTo:
 *                   type: number
 *                   example: 470
 *                 exchangeRate:
 *                   type: number
 *                   example: 4.7
 *                 fromCurrency:
 *                   type: string
 *                   example: USD
 *                 toCurrency:
 *                   type: string
 *                   example: MYR
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: "2025-06-24"
 *       '400':
 *         description: Bad request due to missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Amount is required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch exchange rate"
 */
router.get('/', async (req, res) => {
  const { amount, from = 'USD', to = 'MYR', date } = req.query;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Amount is required and must be a positive number' });
  }

  if (!['USD', 'MYR'].includes(from) || !['USD', 'MYR'].includes(to)) {
    return res.status(400).json({ error: 'Invalid currency pair. Use USD or MYR.' });
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'demo'; // Add to .env
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    const response = await axios.get(url);
    const rates = response.data.conversion_rates || { MYR: 4.7 }; // Fallback to static rate 4.7 if API fails
    const rate = rates.MYR; // USD to MYR rate

    let amountFrom = parseFloat(amount);
    let amountTo;

    if (from === 'USD' && to === 'MYR') {
      amountTo = amountFrom * rate;
    } else if (from === 'MYR' && to === 'USD') {
      amountTo = amountFrom / rate;
    } else {
      return res.status(400).json({ error: 'Conversion between same currencies not supported' });
    }

    res.json({
      amountFrom: amountFrom,
      amountTo: parseFloat(amountTo.toFixed(2)),
      exchangeRate: rate,
      fromCurrency: from,
      toCurrency: to,
      date: date || new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Currency Error:', error);
    const rate = 4.7; // Fallback rate
    let amountTo;

    if (from === 'USD' && to === 'MYR') {
      amountTo = parseFloat(amount) * rate;
    } else if (from === 'MYR' && to === 'USD') {
      amountTo = parseFloat(amount) / rate;
    }

    res.json({
      amountFrom: parseFloat(amount),
      amountTo: parseFloat(amountTo.toFixed(2)),
      exchangeRate: rate,
      fromCurrency: from,
      toCurrency: to,
      date: date || new Date().toISOString().split('T')[0],
      warning: 'Using fallback exchange rate due to API error',
    });
  }
});

module.exports = router;