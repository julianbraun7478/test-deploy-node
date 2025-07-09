const express = require('express');
const router = express.Router();
const Affiliate = require('../models/Affiliate');
const { authenticateToken } = require('../middleware/auth'); // Assume admin-only middleware
const moment = require('moment-timezone'); // For date handling

/**
 * @swagger
 * components:
 *   schemas:
 *     AffiliateReport:
 *       type: object
 *       properties:
 *         totalAffiliates:
 *           type: number
 *           description: The total number of affiliates
 *         totalReferrals:
 *           type: number
 *           description: The total number of referrals across all affiliates
 *         totalRewards:
 *           type: number
 *           description: The total rewards earned by all affiliates
 *         affiliates:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: The display name or email of the affiliate
 *               tier:
 *                 type: string
 *                 description: The name of the affiliate's tier
 *               referralCount:
 *                 type: number
 *                 description: The number of referrals by the affiliate
 *               totalRewards:
 *                 type: number
 *                 description: The total rewards earned by the affiliate
 *               lastUpdated:
 *                 type: string
 *                 format: date-time
 *                 description: The last update date of the affiliate
 *       example:
 *         totalAffiliates: 3
 *         totalReferrals: 65
 *         totalRewards: 325
 *         affiliates:
 *           - user: "john.doe@example.com"
 *             tier: "Pro Tier"
 *             referralCount: 15
 *             totalRewards: 150
 *             lastUpdated: "2025-07-06T21:49:00Z"
 */

/**
 * @swagger
 * tags:
 *   name: Affiliate Reports
 *   description: API endpoints for generating affiliate reports
 */

/**
 * @swagger
 * /api/affiliate-reports:
 *   get:
 *     summary: Generate affiliate performance report
 *     tags: [Affiliate Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Affiliate performance report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   $ref: '#/components/schemas/AffiliateReport'
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { updatedAt: {} };
        if (startDate) query.updatedAt.$gte = moment.tz(startDate, 'YYYY-MM-DD', 'America/Los_Angeles').toDate();
        if (endDate) query.updatedAt.$lte = moment.tz(endDate, 'YYYY-MM-DD', 'America/Los_Angeles').endOf('day').toDate();
        else query.updatedAt.$lte = moment.tz('2025-07-06 21:49', 'America/Los_Angeles').toDate(); // 09:49 PM PDT, July 06, 2025

        const affiliates = await Affiliate.find(query)
            .populate('userId', 'displayName email')
            .populate('tierId', 'name rewardRate');

        const report = {
            totalAffiliates: affiliates.length,
            totalReferrals: affiliates.reduce((sum, aff) => sum + aff.referralCount, 0),
            totalRewards: affiliates.reduce((sum, aff) => sum + aff.totalRewards, 0),
            affiliates: affiliates.map(aff => ({
                user: aff.userId.displayName || aff.userId.email,
                tier: aff.tierId.name,
                referralCount: aff.referralCount,
                totalRewards: aff.totalRewards,
                lastUpdated: aff.updatedAt,
            })),
        };

        res.json({ report });
    } catch (error) {
        console.error('Report Error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;