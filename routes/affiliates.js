const express = require('express');
const router = express.Router();
const Affiliate = require('../models/Affiliate');
const AffiliateTier = require('../models/AffiliateTier');
const { authenticateToken } = require('../middleware/auth'); // Assume admin-only middleware
const moment = require('moment-timezone'); // For date handling

/**
 * @swagger
 * components:
 *   schemas:
 *     Affiliate:
 *       type: object
 *       required:
 *         - userId
 *         - tierId
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user associated with the affiliate
 *         tierId:
 *           type: string
 *           description: The ID of the tier assigned to the affiliate
 *         referralCount:
 *           type: number
 *           description: The number of referrals made by the affiliate
 *         totalRewards:
 *           type: number
 *           description: The total rewards earned by the affiliate
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation date of the affiliate
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The last update date of the affiliate
 *       example:
 *         userId: "507f1f77bcf86cd799439011"
 *         tierId: "507f1f77bcf86cd799439012"
 *         referralCount: 5
 *         totalRewards: 25
 *         createdAt: "2025-07-06T21:43:00Z"
 *         updatedAt: "2025-07-06T21:43:00Z"
 *     Tier:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The ID of the tier
 *         name:
 *           type: string
 *           enum: [Basic Tier, Pro Tier, Elite Tier]
 *           description: The name of the tier
 *         minReferrals:
 *           type: number
 *           description: The minimum number of referrals required
 *         commissionRate:
 *           type: number
 *           description: The commission rate (percentage or fixed amount)
 *         bonusPoints:
 *           type: boolean
 *           description: Indicates if bonus points are enabled
 *         specialBadges:
 *           type: boolean
 *           description: Indicates if special badges are enabled
 */

/**
 * @swagger
 * tags:
 *   name: Affiliates
 *   description: API endpoints for managing affiliates
 */

/**
 * @swagger
 * /api/affiliates:
 *   get:
 *     summary: Retrieve all affiliates
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of affiliates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 affiliates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Affiliate'
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const affiliates = await Affiliate.find()
            .populate('userId', 'displayName email')
            .populate('tierId', 'name minReferrals commissionRate bonusPoints specialBadges')
            .sort({ updatedAt: -1 });
        res.json({ affiliates });
    } catch (error) {
        console.error('Affiliate Error:', error);
        res.status(500).json({ error: 'Failed to retrieve affiliates' });
    }
});

/**
 * @swagger
 * /api/affiliates/{id}:
 *   get:
 *     summary: Retrieve a specific affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the affiliate to retrieve
 *     responses:
 *       200:
 *         description: The affiliate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 affiliate:
 *                   $ref: '#/components/schemas/Affiliate'
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const affiliate = await Affiliate.findById(req.params.id)
            .populate('userId', 'displayName email')
            .populate('tierId', 'name minReferrals commissionRate bonusPoints specialBadges');
        if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });
        res.json({ affiliate });
    } catch (error) {
        console.error('Affiliate Error:', error);
        res.status(500).json({ error: 'Failed to retrieve affiliate' });
    }
});

/**
 * @swagger
 * /api/affiliates:
 *   post:
 *     summary: Create a new affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               tierId:
 *                 type: string
 *             example:
 *               userId: "507f1f77bcf86cd799439011"
 *               tierId: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Affiliate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 affiliate:
 *                   $ref: '#/components/schemas/Affiliate'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Tier not found
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { userId, tierId } = req.body;
        if (!userId || !tierId) return res.status(400).json({ error: 'User ID and Tier ID are required' });

        const tier = await AffiliateTier.findById(tierId);
        if (!tier) return res.status(404).json({ error: 'Tier not found' });

        const affiliate = new Affiliate({ userId, tierId });
        await affiliate.save();
        res.status(201).json({ message: 'Affiliate created successfully', affiliate });
    } catch (error) {
        console.error('Affiliate Error:', error);
        res.status(500).json({ error: 'Failed to create affiliate' });
    }
});

/**
 * @swagger
 * /api/affiliates/{id}:
 *   put:
 *     summary: Update an affiliate (including upgrade/downgrade tier)
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the affiliate to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referralCount:
 *                 type: number
 *               totalRewards:
 *                 type: number
 *               action:
 *                 type: string
 *                 enum: [upgrade, downgrade]
 *                 description: Action to change the tier (optional)
 *             example:
 *               referralCount: 15
 *               action: upgrade
 *     responses:
 *       200:
 *         description: Affiliate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 affiliate:
 *                   $ref: '#/components/schemas/Affiliate'
 *       400:
 *         description: Invalid action or insufficient referrals
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { referralCount, totalRewards, action } = req.body; // 'upgrade' or 'downgrade' for tier adjustment
        const affiliate = await Affiliate.findById(req.params.id).populate('tierId', 'name minReferrals commissionRate');
        if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });

        let tierId = affiliate.tierId._id;
        const currentTierIndex = ['Basic Tier', 'Pro Tier', 'Elite Tier'].indexOf(affiliate.tierId.name);
        const tiers = await AffiliateTier.find().sort({ minReferrals: 1 });

        if (action === 'upgrade' || action === 'downgrade') {
            const targetIndex = action === 'upgrade' ? currentTierIndex + 1 : currentTierIndex - 1;
            if (targetIndex >= 0 && targetIndex < tiers.length) {
                const targetTier = tiers[targetIndex];
                if (affiliate.referralCount >= targetTier.minReferrals || action === 'downgrade') {
                    tierId = targetTier._id;
                } else {
                    return res.status(400).json({ error: `Referral count (${affiliate.referralCount}) does not meet minimum (${targetTier.minReferrals}) for ${targetTier.name}` });
                }
            } else {
                return res.status(400).json({ error: `Cannot ${action} tier: already at ${action === 'upgrade' ? 'highest' : 'lowest'} tier` });
            }
        }

        const updatedAffiliate = await Affiliate.findByIdAndUpdate(
            req.params.id,
            { tierId, referralCount, totalRewards, updatedAt: moment.tz('America/Los_Angeles').toDate() }, // 09:43 PM PDT, July 06, 2025
            { new: true, runValidators: true }
        ).populate('tierId', 'name minReferrals commissionRate bonusPoints specialBadges');

        res.json({ message: 'Affiliate updated successfully', affiliate: updatedAffiliate });
    } catch (error) {
        console.error('Affiliate Error:', error);
        res.status(500).json({ error: 'Failed to update affiliate' });
    }
});

/**
 * @swagger
 * /api/affiliates/{id}:
 *   delete:
 *     summary: Delete an affiliate
 *     tags: [Affiliates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the affiliate to delete
 *     responses:
 *       200:
 *         description: Affiliate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Affiliate not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const affiliate = await Affiliate.findByIdAndDelete(req.params.id);
        if (!affiliate) return res.status(404).json({ error: 'Affiliate not found' });
        res.json({ message: 'Affiliate deleted successfully' });
    } catch (error) {
        console.error('Affiliate Error:', error);
        res.status(500).json({ error: 'Failed to delete affiliate' });
    }
});

module.exports = router;