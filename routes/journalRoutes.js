const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const { authenticateToken } = require('../middleware/auth');

// Create Journal Note API
/**
 * @swagger
 * /api/journals:
 *   post:
 *     summary: Create a new journal note for the authenticated user
 *     description: Adds a new journal entry for the authenticated user with note and feeling. User ID and timestamp are derived from the authentication token and system time, respectively.
 *     tags: [Journal API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Today was a great day..."
 *               feeling:
 *                 type: string
 *                 example: "happy"
 *     responses:
 *       '201':
 *         description: Journal note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Journal note created successfully"
 *                 journal:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *                     note:
 *                       type: string
 *                       example: "Today was a great day..."
 *                     feeling:
 *                       type: string
 *                       example: "happy"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-04T05:13:00Z"
 *       '400':
 *         description: Bad request due to missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "note and feeling are required"
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
 *                   example: "Failed to create journal note"
 */
router.post('/', authenticateToken, async (req, res) => {
  const { note, feeling } = req.body;
  const userId = req.user.id;

  if (!note || !feeling) {
    return res.status(400).json({ error: 'note and feeling are required' });
  }

  try {
    const journal = new Journal({
      userId,
      note,
      feeling,
      timestamp: new Date()
    });

    await journal.save();

    const io = req.app.get('io');
    io.to(userId).emit('newJournalNote', journal); // Real-time update

    res.status(201).json({ message: 'Journal note created successfully', journal });
  } catch (error) {
    console.error('Journal Error:', error);
    res.status(500).json({ error: 'Failed to create journal note' });
  }
});

// Get All Journal Notes API
/**
 * @swagger
 * /api/journals:
 *   get:
 *     summary: Retrieve all journal notes for the authenticated user
 *     description: Fetches all journal notes for the authenticated user, filterable by timestamp. User ID is derived from the authentication token.
 *     tags: [Journal API]
 *     security:
 *       - bearerAuth: []
 *     
 *     responses:
 *       '200':
 *         description: Successful response with journal notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *                       note:
 *                         type: string
 *                         example: "Today was a great day..."
 *                       feeling:
 *                         type: string
 *                         example: "happy"
 *                       userId:
 *                         type: string
 *                         example: "user123"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-07-04T05:13:00Z"
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
 *                   example: "Failed to retrieve journal notes"
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    let query = { userId };

    const journals = await Journal.find(query).sort({ timestamp: -1 });
    res.json({ journals });
  } catch (error) {
    console.error('Journal Error:', error);
    res.status(500).json({ error: 'Failed to retrieve journal notes' });
  }
});

// Update Journal Note API
/**
 * @swagger
 * /api/journals/{id}:
 *   put:
 *     summary: Update a journal note for the authenticated user
 *     description: Updates the details of a specific journal note for the authenticated user. Timestamp is updated automatically.
 *     tags: [Journal API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Today was an even better day..."
 *               feeling:
 *                 type: string
 *                 example: "excited"
 *     responses:
 *       '200':
 *         description: Journal note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Journal note updated successfully"
 *                 journal:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *                     note:
 *                       type: string
 *                       example: "Today was an even better day..."
 *                     feeling:
 *                       type: string
 *                       example: "excited"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-04T05:13:00Z"
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
 *         description: Journal note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Journal note not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update journal note"
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { note, feeling } = req.body;
  const userId = req.user.id;

  if (!note && !feeling) {
    return res.status(400).json({ error: 'At least one of note or feeling is required' });
  }

  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: id, userId },
      { note, feeling, timestamp: new Date() },
      { new: true, runValidators: true }
    );
    if (!journal) {
      return res.status(404).json({ error: 'Journal note not found' });
    }

    const io = req.app.get('io');
    io.to(userId).emit('updateJournalNote', journal); // Real-time update

    res.json({ message: 'Journal note updated successfully', journal });
  } catch (error) {
    console.error('Journal Error:', error);
    res.status(500).json({ error: 'Failed to update journal note' });
  }
});

// Delete Journal Note API
/**
 * @swagger
 * /api/journals/{id}:
 *   delete:
 *     summary: Delete a journal note for the authenticated user
 *     description: Deletes a specific journal note for the authenticated user.
 *     tags: [Journal API]
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
 *         description: Journal note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Journal note deleted successfully"
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
 *         description: Journal note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Journal note not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to delete journal note"
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const journal = await Journal.findOneAndDelete({ _id: id, userId });
    if (!journal) {
      return res.status(404).json({ error: 'Journal note not found' });
    }

    const io = req.app.get('io');
    io.to(userId).emit('deleteJournalNote', { id: journal._id }); // Real-time update

    res.json({ message: 'Journal note deleted successfully' });
  } catch (error) {
    console.error('Journal Error:', error);
    res.status(500).json({ error: 'Failed to delete journal note' });
  }
});

module.exports = router;