const express = require('express');
const router = express.Router();
const Signal = require('../models/Signal');
const Performance = require('../models/Performance');
const schedule = require('node-schedule');

/**
 * @swagger
 * /api/signals/list:
 *   get:
 *     summary: Retrieve a list of signals
 *     description: Fetches a list of signals, visible only to Premium users with unlocked access.
 *     tags: [Signals API]
 *     responses:
 *       '200':
 *         description: Successful response with signals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Signal'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error fetching signals"
 */
router.get('/list', async (req, res) => {
  try {
    const signals = await Signal.find()
      .sort({ date: -1 })
      .limit(30);
    res.json({ signals });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching signals' });
  }
});

/**
 * @swagger
 * /api/signals/create:
 *   post:
 *     summary: Create a new signal
 *     description: Adds a new signal, visible only to Premium users with unlocked access. Category is fixed as Premium users.
 *     tags: [Signals API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset:
 *                 type: string
 *                 example: "EUR/USD"
 *               entryPrice:
 *                 type: number
 *                 example: 11500
 *               stopLoss:
 *                 type: number
 *                 example: 11450
 *               takeProfit:
 *                 type: number
 *                 example: 11550
 *               reasoning:
 *                 type: string
 *                 example: "Market trend analysis"
 *               entryType:
 *                 type: string
 *                 enum: [Buy, Sell, Buy limit, Sell limit]
 *                 example: "Sell"
 *               publishTiming:
 *                 type: string
 *                 enum: [Immediate Publish, Scheduled Publish]
 *                 example: "Scheduled Publish"
 *               publishDate:
 *                 type: string
 *                 example: "2025-06-27"
 *               publishTime:
 *                 type: string
 *                 example: "14:30:00"
 *     responses:
 *       '201':
 *         description: Signal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signal created successfully"
 *                 signal:
 *                   $ref: '#/components/schemas/Signal'
 *       '400':
 *         description: Bad request due to missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Asset, entryPrice, stopLoss, and takeProfit are required"
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error creating signal"
 */
router.post('/create', async (req, res) => {
  try {
    const { asset, entryPrice, stopLoss, takeProfit, reasoning, entryType, publishTiming, publishDate, publishTime } = req.body;

    if (!asset || !entryPrice || !stopLoss || !takeProfit) {
      return res.status(400).json({ error: 'Asset, entryPrice, stopLoss, and takeProfit are required' });
    }

    if (!['Buy', 'Sell', 'Buy limit', 'Sell limit'].includes(entryType)) {
      return res.status(400).json({ error: 'Invalid entryType' });
    }

    if (!['Immediate Publish', 'Scheduled Publish'].includes(publishTiming)) {
      return res.status(400).json({ error: 'Invalid publishTiming' });
    }

    const signalId = 'S' + Math.floor(100 + Math.random() * 900).toString();
    const signal = new Signal({
      signalId,
      date: new Date(),
      asset,
      entryPrice,
      stopLoss,
      takeProfit,
      reasoning,
      entryType,
      category: 'Premium users',
      publishTiming,
      publishDate: publishTiming === 'Scheduled Publish' ? new Date(publishDate + ' ' + publishTime) : new Date(),
      status: publishTiming === 'Immediate Publish' ? 'Published' : 'Scheduled'
    });

    await signal.save();

    const io = req.app.get('io');
    let performance = await Performance.findOne();
    if (!performance) {
      performance = await Performance.create({
        totalProfitLoss: 0,
        tradeCount: 0,
        historicalData: []
      });
    }

    const profitLoss = entryPrice - stopLoss; // Simple profit/loss calculation
    performance.totalProfitLoss += profitLoss;
    performance.tradeCount += 1;
    performance.historicalData.push({
      signalId,
      date: signal.date,
      profitLoss,
      pipMovement: '2.00R +' + (takeProfit - entryPrice) + ' pips'
    });
    await performance.save();

    io.emit('newSignal', {
      signalId: signal.signalId,
      date: signal.date,
      profitLoss,
      tradeCount: 1,
      pipMovement: '2.00R +' + (takeProfit - entryPrice) + ' pips'
    });

    if (publishTiming === 'Scheduled Publish' && publishDate && publishTime) {
      const scheduledDateTime = new Date(publishDate + ' ' + publishTime);
      if (scheduledDateTime > new Date()) {
        schedule.scheduleJob(signalId, scheduledDateTime, async () => {
          const updatedSignal = await Signal.findOne({ signalId });
          if (updatedSignal && updatedSignal.status === 'Scheduled') {
            updatedSignal.status = 'Published';
            await updatedSignal.save();
            io.emit('newSignal', {
              signalId: updatedSignal.signalId,
              date: updatedSignal.date,
              profitLoss: updatedSignal.entryPrice - updatedSignal.stopLoss,
              tradeCount: 1,
              pipMovement: '2.00R +' + (updatedSignal.takeProfit - updatedSignal.entryPrice) + ' pips'
            });
          }
        });
      }
    }

    res.status(201).json({ message: 'Signal created successfully', signal });
  } catch (error) {
    console.error('Signal Error:', error);
    res.status(500).json({ error: 'Error creating signal' });
  }
});

/**
 * @swagger
 * /api/signals/edit/{signalId}:
 *   put:
 *     summary: Edit an existing signal
 *     description: Updates an existing signal, visible only to Premium users with unlocked access. Category remains Premium users.
 *     tags: [Signals API]
 *     parameters:
 *       - name: signalId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "S501"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               asset:
 *                 type: string
 *                 example: "EUR/USD"
 *               entryPrice:
 *                 type: number
 *                 example: 11500
 *               stopLoss:
 *                 type: number
 *                 example: 11450
 *               takeProfit:
 *                 type: number
 *                 example: 11550
 *               reasoning:
 *                 type: string
 *                 example: "Market trend analysis"
 *               entryType:
 *                 type: string
 *                 enum: [Buy, Sell, Buy limit, Sell limit]
 *                 example: "Sell"
 *               publishTiming:
 *                 type: string
 *                 enum: [Immediate Publish, Scheduled Publish]
 *                 example: "Scheduled Publish"
 *               publishDate:
 *                 type: string
 *                 example: "2025-06-27"
 *               publishTime:
 *                 type: string
 *                 example: "14:30:00"
 *     responses:
 *       '200':
 *         description: Signal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signal updated successfully"
 *                 signal:
 *                   $ref: '#/components/schemas/Signal'
 *       '404':
 *         description: Signal not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Signal not found"
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error updating signal"
 */
router.put('/edit/:signalId', async (req, res) => {
  try {
    const { signalId } = req.params;
    const { asset, entryPrice, stopLoss, takeProfit, reasoning, entryType, publishTiming, publishDate, publishTime } = req.body;

    const signal = await Signal.findOne({ signalId });
    if (!signal) return res.status(404).json({ error: 'Signal not found' });

    if (entryType && !['Buy', 'Sell', 'Buy limit', 'Sell limit'].includes(entryType)) {
      return res.status(400).json({ error: 'Invalid entryType' });
    }

    if (publishTiming && !['Immediate Publish', 'Scheduled Publish'].includes(publishTiming)) {
      return res.status(400).json({ error: 'Invalid publishTiming' });
    }

    signal.asset = asset || signal.asset;
    signal.entryPrice = entryPrice || signal.entryPrice;
    signal.stopLoss = stopLoss || signal.stopLoss;
    signal.takeProfit = takeProfit || signal.takeProfit;
    signal.reasoning = reasoning || signal.reasoning;
    signal.entryType = entryType || signal.entryType;
    signal.category = 'Premium users';
    signal.publishTiming = publishTiming || signal.publishTiming;
    signal.publishDate = publishTiming === 'Scheduled Publish' ? new Date(publishDate + ' ' + publishTime) : new Date();
    signal.status = publishTiming === 'Immediate Publish' ? 'Published' : 'Scheduled';

    const existingJob = schedule.scheduledJobs[signalId];
    if (existingJob) existingJob.cancel();

    if (publishTiming === 'Scheduled Publish' && publishDate && publishTime) {
      const scheduledDateTime = new Date(publishDate + ' ' + publishTime);
      if (scheduledDateTime > new Date()) {
        schedule.scheduleJob(signalId, scheduledDateTime, async () => {
          const updatedSignal = await Signal.findOne({ signalId });
          if (updatedSignal && updatedSignal.status === 'Scheduled') {
            updatedSignal.status = 'Published';
            await updatedSignal.save();
            io.emit('newSignal', {
              signalId: updatedSignal.signalId,
              date: updatedSignal.date,
              profitLoss: updatedSignal.entryPrice - updatedSignal.stopLoss,
              tradeCount: 1,
              pipMovement: '2.00R +' + (updatedSignal.takeProfit - updatedSignal.entryPrice) + ' pips'
            });
          }
        });
      }
    }

    await signal.save();
    res.json({ message: 'Signal updated successfully', signal });
  } catch (error) {
    console.error('Signal Error:', error);
    res.status(500).json({ error: 'Error updating signal' });
  }
});

/**
 * @swagger
 * /api/signals/delete/{signalId}:
 *   delete:
 *     summary: Delete a signal
 *     description: Removes a signal, visible only to Premium users with unlocked access.
 *     tags: [Signals API]
 *     parameters:
 *       - name: signalId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "S501"
 *     responses:
 *       '200':
 *         description: Signal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Signal deleted successfully"
 *       '404':
 *         description: Signal not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Signal not found"
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error deleting signal"
 */
router.delete('/delete/:signalId', async (req, res) => {
  try {
    const { signalId } = req.params;
    const signal = await Signal.findOneAndDelete({ signalId });
    if (!signal) return res.status(404).json({ error: 'Signal not found' });

    const io = req.app.get('io');
    io.emit('signalDeleted', { signalId });

    const existingJob = schedule.scheduledJobs[signalId];
    if (existingJob) existingJob.cancel();

    res.json({ message: 'Signal deleted successfully' });
  } catch (error) {
    console.error('Signal Error:', error);
    res.status(500).json({ error: 'Error deleting signal' });
  }
});

/**
 * @swagger
 * /api/signals/performance:
 *   get:
 *     summary: Retrieve performance metrics
 *     description: Fetches performance metrics and historical data for analytics, visible only to Premium users.
 *     tags: [Signals API]
 *     responses:
 *       '200':
 *         description: Successful response with performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProfitLoss:
 *                   type: number
 *                   example: 1500
 *                 tradeCount:
 *                   type: number
 *                   example: 10
 *                 historicalData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       signalId:
 *                         type: string
 *                         example: "S501"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-27T02:16:00Z"
 *                       profitLoss:
 *                         type: number
 *                         example: 50
 *                       pipMovement:
 *                         type: string
 *                         example: "2.00R +25 pips"
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error fetching performance"
 */
router.get('/performance', async (req, res) => {
  try {
    const performance = await Performance.findOne();
    if (!performance) {
      return res.json({ totalProfitLoss: 0, tradeCount: 0, historicalData: [] });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching performance' });
  }
});

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Signal:
 *       type: object
 *       properties:
 *         signalId:
 *           type: string
 *           example: "S501"
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2025-06-27T02:16:00Z"
 *         asset:
 *           type: string
 *           example: "EUR/USD"
 *         entryPrice:
 *           type: number
 *           example: 11500
 *         stopLoss:
 *           type: number
 *           example: 11450
 *         takeProfit:
 *           type: number
 *           example: 11550
 *         reasoning:
 *           type: string
 *           example: "Market trend analysis"
 *         entryType:
 *           type: string
 *           enum: [Buy, Sell, Buy limit, Sell limit]
 *           example: "Sell"
 *         category:
 *           type: string
 *           enum: [Premium users]
 *           example: "Premium users"
 *         publishTiming:
 *           type: string
 *           enum: [Immediate Publish, Scheduled Publish]
 *           example: "Scheduled Publish"
 *         publishDate:
 *           type: string
 *           format: date-time
 *           example: "2025-06-27T14:30:00Z"
 *         publishTime:
 *           type: string
 *           example: "14:30:00"
 *         status:
 *           type: string
 *           enum: [Published, Scheduled]
 *           example: "Scheduled"
 */