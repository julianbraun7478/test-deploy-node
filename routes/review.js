const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const multer = require('multer');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.memoryStorage(); // Store in memory
const upload = multer({ storage }).array('images', 5); // Up to 5 images

// Submit Review API
/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Submit a client review for the authenticated user
 *     description: Allows the authenticated user to leave a review with a rating, text, and multiple images stored as Base64. User ID is derived from the authentication token.
 *     tags: [Reviews API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: string
 *                 enum: [Lovely, Amazing, Wonderful]
 *                 example: "Amazing"
 *               reviewText:
 *                 type: string
 *                 example: "Great service, highly recommended!"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '201':
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review submitted successfully"
 *                 review:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *                     rating:
 *                       type: string
 *                       example: "Amazing"
 *                     reviewText:
 *                       type: string
 *                       example: "Great service, highly recommended!"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-04T07:03:00Z"
 *       '400':
 *         description: Bad request due to missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Rating and reviewText are required"
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
 *                   example: "Failed to process upload"
 */
router.post('/', authenticateToken, upload, async (req, res) => {
  const { rating, reviewText } = req.body;
  const userId = req.user.id;
  const images = req.files ? req.files.map(file => {
    const mimeType = file.mimetype; // e.g., 'image/jpeg'
    const base64Data = file.buffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }) : [];

  if (!rating || !reviewText) {
    return res.status(400).json({ error: 'Rating and reviewText are required' });
  }

  if (!['Lovely', 'Amazing', 'Wonderful'].includes(rating)) {
    return res.status(400).json({ error: 'Rating must be Lovely, Amazing, or Wonderful' });
  }

  try {
    const review = new Review({ rating, reviewText, images, userId, timestamp: new Date() });
    await review.save();
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Review Error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// Get All Reviews API
/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews for the authenticated user
 *     description: Retrieves a list of all reviews submitted by the authenticated user.
 *     tags: [Reviews API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *                       rating:
 *                         type: string
 *                         example: "Amazing"
 *                       reviewText:
 *                         type: string
 *                         example: "Great service, highly recommended!"
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *                       userId:
 *                         type: string
 *                         example: "user123"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-04T07:03:00Z"
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
 *                   example: "Failed to retrieve reviews"
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ timestamp: -1 });
    res.json({ reviews });
  } catch (error) {
    console.error('Review Error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

// Delete Review API
/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review for the authenticated user
 *     description: Deletes a specific review submitted by the authenticated user.
 *     tags: [Reviews API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *     responses:
 *       '200':
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review deleted successfully"
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
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Review not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete review"
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const review = await Review.findOneAndDelete({ _id: id, userId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review Error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;