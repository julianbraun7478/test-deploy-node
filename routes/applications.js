const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const multer = require('multer');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.memoryStorage(); // Store in memory
const upload = multer({ storage }).single('selfie'); // Single image upload for selfie

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - telegramId
 *         - phoneNumber
 *         - currentlyWorking
 *         - tradingExperience
 *         - profitableTrader
 *         - joinedLLPackage
 *         - tradingBroker
 *         - activeTrader
 *         - followSignalGroups
 *         - accountBalance
 *         - risk1kUSD
 *         - invest1kUSD
 *         - hardWorker
 *         - joinReason
 *         - extraMile
 *         - feedbackWillingness
 *         - selfieBase64
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: string
 *           example: "user123"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         telegramId:
 *           type: string
 *           example: "@johndoe"
 *         phoneNumber:
 *           type: string
 *           example: "+1234567890"
 *         currentlyWorking:
 *           type: string
 *           enum: ["Yes, as an employee", "Yes, I own a business", "No, I'm currently not working"]
 *           example: "Yes, as an employee"
 *         tradingExperience:
 *           type: string
 *           enum: ["Beginner (0-2 years)", "Intermediate (3-5 years)", "Expert (5 years+)"]
 *           example: "Beginner (0-2 years)"
 *         profitableTrader:
 *           oneOf:
 *             - type: string
 *               example: "Yes"
 *             - type: number
 *               example: 500
 *           description: Enter "Yes" or a number for overall loss
 *         joinedLLPackage:
 *           oneOf:
 *             - type: string
 *               example: "Yes"
 *             - type: number
 *               example: 500
 *           description: Enter "Yes" or a number for overall loss
 *         tradingBroker:
 *           type: string
 *           example: "BrokerX"
 *         activeTrader:
 *           type: string
 *           enum: ["Yes", "No"]
 *           example: "Yes"
 *         followSignalGroups:
 *           type: string
 *           enum: ["Yes", "No"]
 *           example: "No"
 *         accountBalance:
 *           type: string
 *           enum: ["Below 1k USD", "1-5k USD", "5-10k USD", "10k USD and above", "I'm not an active Trader on my real account"]
 *           example: "1-5k USD"
 *         risk1kUSD:
 *           type: string
 *           enum: ["Yes", "No"]
 *           example: "Yes"
 *         invest1kUSD:
 *           type: string
 *           enum: ["Yes", "No"]
 *           example: "Yes"
 *         hardWorker:
 *           type: string
 *           enum: ["Yes", "No", "Depends on what"]
 *           example: "Yes"
 *         joinReason:
 *           type: string
 *           example: "To improve trading skills"
 *         extraMile:
 *           type: string
 *           example: "Yes, I am committed"
 *         feedbackWillingness:
 *           type: string
 *           enum: ["Not Willing at all", "More no than yes", "More yes than no", "Very Willing"]
 *           example: "Very Willing"
 *         selfieBase64:
 *           type: string
 *           example: "data:image/jpeg;base64,base64string..."
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-07-04T09:45:00Z"
 *       additionalProperties: false
 *   responses:
 *     Error:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Failed to fetch applications"
 */

/**
 * @swagger
 * tags:
 *   - name: Application API
 *     description: API endpoints for managing Exclusive VVIP by LL applications
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Fetch all applications
 *     description: Retrieves all submitted application forms from MongoDB.
 *     tags: [Application API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successful response with applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       '500':
 *         $ref: '#/components/responses/Error'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find().sort({ id: 1 });
    res.json({ applications });
  } catch (error) {
    console.error('Applications Error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Add a new application
 *     description: Submits a new application form with a selfie image stored as Base64 for the authenticated user. Only one submission per userId is allowed. profitableTrader and joinedLLPackage can be "Yes" or a number for overall loss.
 *     tags: [Application API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               telegramId:
 *                 type: string
 *                 example: "@johndoe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               currentlyWorking:
 *                 type: string
 *                 enum: ["Yes, as an employee", "Yes, I own a business", "No, I'm currently not working"]
 *                 example: "Yes, as an employee"
 *               tradingExperience:
 *                 type: string
 *                 enum: ["Beginner (0-2 years)", "Intermediate (3-5 years)", "Expert (5 years+)"]
 *                 example: "Beginner (0-2 years)"
 *               profitableTrader:
 *                 oneOf:
 *                   - type: string
 *                     example: "Yes"
 *                   - type: number
 *                     example: 500
 *                 description: Enter "Yes" or a number for overall loss
 *               joinedLLPackage:
 *                 oneOf:
 *                   - type: string
 *                     example: "Yes"
 *                   - type: number
 *                     example: 500
 *                 description: Enter "Yes" or a number for overall loss
 *               tradingBroker:
 *                 type: string
 *                 example: "BrokerX"
 *               activeTrader:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               followSignalGroups:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "No"
 *               accountBalance:
 *                 type: string
 *                 enum: ["Below 1k USD", "1-5k USD", "5-10k USD", "10k USD and above", "I'm not an active Trader on my real account"]
 *                 example: "1-5k USD"
 *               risk1kUSD:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               invest1kUSD:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               hardWorker:
 *                 type: string
 *                 enum: ["Yes", "No", "Depends on what"]
 *                 example: "Yes"
 *               joinReason:
 *                 type: string
 *                 example: "To improve trading skills"
 *               extraMile:
 *                 type: string
 *                 example: "Yes, I am committed"
 *               feedbackWillingness:
 *                 type: string
 *                 enum: ["Not Willing at all", "More no than yes", "More yes than no", "Very Willing"]
 *                 example: "Very Willing"
 *               selfie:
 *                 type: string
 *                 format: binary
 *                 description: Selfie image with "LL" on paper
 *     responses:
 *       '201':
 *         description: Application added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Application added with ID 1"
 *                 id:
 *                   type: integer
 *                   example: 1
 *       '400':
 *         description: Bad request due to invalid data or duplicate userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You have already submitted an application"
 *       '500':
 *         $ref: '#/components/responses/Error'
 */
router.post('/', authenticateToken, upload, async (req, res) => {
  const userId = req.user.id;
  const {
    fullName, email, telegramId, phoneNumber, currentlyWorking, tradingExperience,
    profitableTrader, joinedLLPackage, tradingBroker, activeTrader,
    followSignalGroups, accountBalance, risk1kUSD, invest1kUSD, hardWorker,
    joinReason, extraMile, feedbackWillingness
  } = req.body;

  if (!fullName || !email || !telegramId || !phoneNumber || !currentlyWorking || !tradingExperience ||
      !profitableTrader || !joinedLLPackage || !tradingBroker || !activeTrader || !followSignalGroups ||
      !accountBalance || !risk1kUSD || !invest1kUSD || !hardWorker || !joinReason || !extraMile ||
      !feedbackWillingness || !req.file) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Convert and validate profitableTrader
  let parsedProfitableTrader = profitableTrader.trim();
  if (parsedProfitableTrader.toLowerCase() === 'yes') {
    parsedProfitableTrader = 'Yes';
  } else {
    const num = parseFloat(parsedProfitableTrader);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'profitableTrader must be "Yes" or a positive number' });
    }
    parsedProfitableTrader = num;
  }

  // Convert and validate joinedLLPackage
  let parsedJoinedLLPackage = joinedLLPackage.trim();
  if (parsedJoinedLLPackage.toLowerCase() === 'yes') {
    parsedJoinedLLPackage = 'Yes';
  } else {
    const num = parseFloat(parsedJoinedLLPackage);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ error: 'joinedLLPackage must be "Yes" or a positive number' });
    }
    parsedJoinedLLPackage = num;
  }

  try {
    const existingApplication = await Application.findOne({ userId });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already submitted an application' });
    }

    const lastApplication = await Application.findOne().sort({ id: -1 });
    const newId = lastApplication ? lastApplication.id + 1 : 1;
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
    const base64Data = req.file.buffer.toString('base64');
    const selfieBase64 = `data:${mimeType};base64,${base64Data}`;

    const newApplication = new Application({
      id: newId,
      userId,
      fullName,
      email,
      telegramId,
      phoneNumber,
      currentlyWorking,
      tradingExperience,
      profitableTrader: parsedProfitableTrader,
      joinedLLPackage: parsedJoinedLLPackage,
      tradingBroker,
      activeTrader,
      followSignalGroups,
      accountBalance,
      risk1kUSD,
      invest1kUSD,
      hardWorker,
      joinReason,
      extraMile,
      feedbackWillingness,
      selfieBase64,
      timestamp: new Date()
    });
    await newApplication.save();
    res.status(201).json({ message: `Application added with ID ${newId}`, id: newId });
  } catch (error) {
    console.error('Add Application Error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Edit an application
 *     description: Updates an existing application in MongoDB for the authenticated user (selfieBase64 not updated).
 *     tags: [Application API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               telegramId:
 *                 type: string
 *                 example: "@johndoe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               currentlyWorking:
 *                 type: string
 *                 enum: ["Yes, as an employee", "Yes, I own a business", "No, I'm currently not working"]
 *                 example: "Yes, as an employee"
 *               tradingExperience:
 *                 type: string
 *                 enum: ["Beginner (0-2 years)", "Intermediate (3-5 years)", "Expert (5 years+)"]
 *                 example: "Beginner (0-2 years)"
 *               profitableTrader:
 *                 oneOf:
 *                   - type: string
 *                     example: "Yes"
 *                   - type: number
 *                     example: 500
 *                 description: Enter "Yes" or a number for overall loss
 *               joinedLLPackage:
 *                 oneOf:
 *                   - type: string
 *                     example: "Yes"
 *                   - type: number
 *                     example: 500
 *                 description: Enter "Yes" or a number for overall loss
 *               tradingBroker:
 *                 type: string
 *                 example: "BrokerX"
 *               activeTrader:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               followSignalGroups:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "No"
 *               accountBalance:
 *                 type: string
 *                 enum: ["Below 1k USD", "1-5k USD", "5-10k USD", "10k USD and above", "I'm not an active Trader on my real account"]
 *                 example: "1-5k USD"
 *               risk1kUSD:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               invest1kUSD:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 example: "Yes"
 *               hardWorker:
 *                 type: string
 *                 enum: ["Yes", "No", "Depends on what"]
 *                 example: "Yes"
 *               joinReason:
 *                 type: string
 *                 example: "To improve trading skills"
 *               extraMile:
 *                 type: string
 *                 example: "Yes, I am committed"
 *               feedbackWillingness:
 *                 type: string
 *                 enum: ["Not Willing at all", "More no than yes", "More yes than no", "Very Willing"]
 *                 example: "Very Willing"
 *     responses:
 *       '200':
 *         description: Application updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Application with ID 1 updated"
 *       '403':
 *         description: Unauthorized access to application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You do not have permission to edit this application"
 *       '404':
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Application not found"
 *       '500':
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const {
    fullName, email, telegramId, phoneNumber, currentlyWorking, tradingExperience,
    profitableTrader, joinedLLPackage, tradingBroker, activeTrader,
    followSignalGroups, accountBalance, risk1kUSD, invest1kUSD, hardWorker,
    joinReason, extraMile, feedbackWillingness
  } = req.body;

  if (!fullName || !email || !telegramId || !phoneNumber || !currentlyWorking || !tradingExperience ||
      !profitableTrader || !joinedLLPackage || !tradingBroker || !activeTrader || !followSignalGroups ||
      !accountBalance || !risk1kUSD || !invest1kUSD || !hardWorker || !joinReason || !extraMile ||
      !feedbackWillingness) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const application = await Application.findOneAndUpdate(
      { id: parseInt(id), userId },
      {
        fullName,
        email,
        telegramId,
        phoneNumber,
        currentlyWorking,
        tradingExperience,
        profitableTrader,
        joinedLLPackage,
        tradingBroker,
        activeTrader,
        followSignalGroups,
        accountBalance,
        risk1kUSD,
        invest1kUSD,
        hardWorker,
        joinReason,
        extraMile,
        feedbackWillingness
      },
      { new: true, runValidators: true }
    );
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (application.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this application' });
    }
    res.json({ message: `Application with ID ${id} updated` });
  } catch (error) {
    console.error('Edit Application Error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete an application
 *     description: Removes an existing application from MongoDB for the authenticated user.
 *     tags: [Application API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       '200':
 *         description: Application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Application with ID 1 deleted"
 *       '403':
 *         description: Unauthorized access to application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "You do not have permission to delete this application"
 *       '404':
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Application not found"
 *       '500':
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const application = await Application.findOneAndDelete({ id: parseInt(id), userId });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: `Application with ID ${id} deleted` });
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;