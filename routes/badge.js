const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your JWT token in the format "Bearer <token>". The userId is extracted from the token.
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: string
 *           example: "Trade Master"
 *         description:
 *           type: string
 *           example: "Awarded for completing 10 trades"
 *         criteria:
 *           type: object
 *           properties:
 *             completing10Trades:
 *               type: boolean
 *               example: true
 *             achieving80Accuracy:
 *               type: boolean
 *               example: false
 *         category:
 *           type: string
 *           example: "Trading"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-01T14:06:00Z"
 *     UserBadge:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         userId:
 *           type: string
 *           example: "user123"
 *         badgeId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         assignedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-07-01T14:06:00Z"
 *
 * /api/badges:
 *   get:
 *     summary: Get all badges
 *     description: Retrieves a list of all badges.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 badges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Badge'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve badges"
 */
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });
    res.json({ badges });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to retrieve badges' });
  }
});

/**
 * @swagger
 * /api/badges:
 *   post:
 *     summary: Create a new badge
 *     description: Creates a new badge with specified title, description, criteria, and category.
 *     tags: [Badges API]
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
 *                 example: "Trade Master"
 *               description:
 *                 type: string
 *                 example: "Awarded for completing 10 trades"
 *               criteria:
 *                 type: object
 *                 properties:
 *                   completing10Trades:
 *                     type: boolean
 *                     example: true
 *                   achieving80Accuracy:
 *                     type: boolean
 *                     example: false
 *               category:
 *                 type: string
 *                 example: "Trading"
 *     responses:
 *       '201':
 *         description: Badge created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Badge created successfully"
 *                 badge:
 *                   $ref: '#/components/schemas/Badge'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create badge"
 */
router.post('/', async (req, res) => {
  const { title, description, criteria, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const badge = new Badge({ title, description, criteria, category });
    await badge.save();

    const io = req.app.get('io');
    io.emit('newBadge', badge);

    res.status(201).json({ message: 'Badge created successfully', badge });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

/**
 * @swagger
 * /api/badges/{badgeId}:
 *   put:
 *     summary: Edit a badge
 *     description: Updates an existing badge with new data.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: badgeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Trade Master"
 *               description:
 *                 type: string
 *                 example: "Awarded for completing 10 trades"
 *               criteria:
 *                 type: object
 *                 properties:
 *                   completing10Trades:
 *                     type: boolean
 *                     example: true
 *                   achieving80Accuracy:
 *                     type: boolean
 *                     example: false
 *               category:
 *                 type: string
 *                 example: "Trading"
 *     responses:
 *       '200':
 *         description: Badge updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Badge updated successfully"
 *                 badge:
 *                   $ref: '#/components/schemas/Badge'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "All fields are required"
 *       '404':
 *         description: Badge not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Badge not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update badge"
 */
router.put('/:badgeId', async (req, res) => {
  const { badgeId } = req.params;
  const { title, description, criteria, category } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    badge.title = title;
    badge.description = description;
    badge.criteria = criteria;
    badge.category = category;
    await badge.save();

    const io = req.app.get('io');
    io.emit('updateBadge', badge);

    res.json({ message: 'Badge updated successfully', badge });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to update badge' });
  }
});

/**
 * @swagger
 * /api/badges/{badgeId}:
 *   delete:
 *     summary: Delete a badge
 *     description: Deletes an existing badge and removes it from all users.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: badgeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       '200':
 *         description: Badge deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Badge deleted successfully"
 *       '404':
 *         description: Badge not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Badge not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete badge"
 */
router.delete('/:badgeId', async (req, res) => {
  const { badgeId } = req.params;

  try {
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    await UserBadge.deleteMany({ badgeId });
    await Badge.findByIdAndDelete(badgeId);

    const io = req.app.get('io');
    io.emit('deleteBadge', badgeId);

    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to delete badge' });
  }
});

/**
 * @swagger
 * /api/badges/assign:
 *   post:
 *     summary: Assign a badge to a user
 *     description: Assigns a badge to a user based on user email and selected badge.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "user@example.com"
 *               badgeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       '201':
 *         description: Badge assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Badge assigned successfully"
 *                 userBadge:
 *                   $ref: '#/components/schemas/UserBadge'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "userEmail and badgeId are required, or user not found"
 *       '404':
 *         description: Badge not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Badge not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to assign badge"
 */
router.post('/assign', async (req, res) => {
  const { userEmail, badgeId } = req.body;

  if (!userEmail || !badgeId) {
    return res.status(400).json({ error: 'userEmail and badgeId are required' });
  }

  try {
    const user = await User.findOne({ email: userEmail }); // Assuming User model has an email field
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }

    const userBadge = new UserBadge({ userId: user._id, badgeId });
    await userBadge.save();

    const io = req.app.get('io');
    io.emit('assignBadge', userBadge);

    res.status(201).json({ message: 'Badge assigned successfully', userBadge });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to assign badge' });
  }
});

/**
 * @swagger
 * /api/badges/revoke:
 *   post:
 *     summary: Revoke a badge from a user
 *     description: Revokes a badge from a user based on user email and badge ID.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 example: "user@example.com"
 *               badgeId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       '200':
 *         description: Badge revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Badge revoked successfully"
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "userEmail and badgeId are required, or user not found"
 *       '404':
 *         description: Badge assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Badge assignment not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to revoke badge"
 */
router.post('/revoke', async (req, res) => {
  const { userEmail, badgeId } = req.body;

  if (!userEmail || !badgeId) {
    return res.status(400).json({ error: 'userEmail and badgeId are required' });
  }

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userBadge = await UserBadge.findOneAndDelete({ userId: user._id, badgeId });
    if (!userBadge) {
      return res.status(404).json({ error: 'Badge assignment not found' });
    }

    const io = req.app.get('io');
    io.emit('revokeBadge', { userId: user._id, badgeId });

    res.json({ message: 'Badge revoked successfully' });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to revoke badge' });
  }
});

/**
 * @swagger
 * /api/badges/users:
 *   get:
 *     summary: Get users with badges
 *     description: Retrieves a list of users who have been assigned badges.
 *     tags: [Badges API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of users with badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         example: "user123"
 *                       email:
 *                         type: string
 *                         example: "user@example.com"
 *                       badges:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Badge'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve users with badges"
 */
router.get('/users', async (req, res) => {
  try {
    const userBadges = await UserBadge.find().populate('badgeId').populate('userId', 'email');
    const usersWithBadges = {};
    userBadges.forEach(ub => {
      if (!usersWithBadges[ub.userId.userId]) {
        usersWithBadges[ub.userId.userId] = { userId: ub.userId.userId, email: ub.userId.email, badges: [] };
      }
      usersWithBadges[ub.userId.userId].badges.push(ub.badgeId);
    });
    res.json({ users: Object.values(usersWithBadges) });
  } catch (error) {
    console.error('Badge Error:', error);
    res.status(500).json({ error: 'Failed to retrieve users with badges' });
  }
});

module.exports = router;