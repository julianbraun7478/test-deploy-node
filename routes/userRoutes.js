const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads (memory storage for base64 conversion)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Update personal info (displayName, phoneNumber, image)
 *     description: Updates the display name, phone number, and/or image for the authenticated user. Image can be uploaded as a file. Requires a valid JWT token in the Authorization header (Bearer <token>).
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "John Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+12025550123"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (e.g., JPG, PNG)
 *     responses:
 *       '200':
 *         description: Personal info updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Personal info updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     displayName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     image:
 *                       type: string
 *       '400':
 *         description: Invalid phone number format or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Please provide a valid phone number in E.164 format"
 *       '401':
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied, no token provided"
 *       '404':
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update personal info"
 */
router.put('/', authenticateToken, upload.single('image'), async (req, res) => {
  const userId = req.user.id;
  const { displayName, phoneNumber } = req.body;
  let image = null;

  if (req.file) {
    const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
    const base64Data = req.file.buffer.toString('base64');
    image = `data:${mimeType};base64,${base64Data}`;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update only the allowed fields
    if (displayName !== undefined) user.displayName = displayName;
    if (phoneNumber !== undefined) {
      if (phoneNumber && !/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
        return res.status(400).json({ error: 'Please provide a valid phone number in E.164 format' });
      }
      user.phoneNumber = phoneNumber;
    }
    if (image !== null) user.avatar = image;

    await user.save();

    const io = req.app.get('io');
    io.to(userId).emit('updatePersonalInfo', { displayName: user.displayName, phoneNumber: user.phoneNumber, avatar: user.avatar }); // Real-time update

    res.json({ message: 'Personal info updated successfully', user: { displayName: user.displayName, phoneNumber: user.phoneNumber, avatar: user.avatar } });
  } catch (error) {
    console.error('User Error:', error);
    res.status(500).json({ error: 'Failed to update personal info' });
  }
});

module.exports = router;