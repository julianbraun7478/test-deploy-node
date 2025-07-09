const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your JWT token in the format "Bearer <token>".
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *         message:
 *           type: string
 *         likes:
 *           type: number
 *         likedBy:
 *           type: array
 *           items:
 *             type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Reply'
 *         timestamp:
 *           type: string
 *           format: date-time
 *     Reply:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *         message:
 *           type: string
 *         likes:
 *           type: number
 *         likedBy:
 *           type: array
 *           items:
 *             type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Reply'
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all discussion posts
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       500:
 *         description: Failed to retrieve posts
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 }).populate('userId', 'displayName avatar');
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new discussion post
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: message is required
 *       500:
 *         description: Failed to create post
 */
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const post = new Post({ userId, name: user.displayName, avatar: user.avatar, message });
    await post.save();

    const io = req.app.get('io');
    io.emit('newPost', post);

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/replies:
 *   post:
 *     summary: Add a reply to a post
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       400:
 *         description: message is required
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to add reply
 */
router.post('/:postId/replies', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const reply = { userId, name: user.displayName, avatar: user.avatar, message, timestamp: new Date(), replies: [], likes: 0, likedBy: [] };
    post.replies.push(reply);
    await post.save();

    res.status(201).json({ message: 'Reply added successfully', reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   post:
 *     summary: Toggle like on a post
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to update likes
 */
router.post('/:postId/likes', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const index = post.likedBy.indexOf(userId);
    if (index > -1) {
      post.likedBy.splice(index, 1);
      post.likes--;
    } else {
      post.likedBy.push(userId);
      post.likes++;
    }
    await post.save();

    res.json({ message: 'Like toggled successfully', likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/replies/{replyId}/replies:
 *   post:
 *     summary: Add a reply to a reply
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nested reply added
 *       404:
 *         description: Post or reply not found
 *       500:
 *         description: Failed to add nested reply
 */
router.post('/:postId/replies/:replyId/replies', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { postId, replyId } = req.params;
  const { message } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const insertNestedReply = (replies) => {
      for (let reply of replies) {
        if (reply._id.toString() === replyId) {
          reply.replies.push({ userId, name: user.displayName, avatar: user.avatar, message, timestamp: new Date(), replies: [], likes: 0, likedBy: [] });
          return true;
        } else if (reply.replies?.length) {
          const nested = insertNestedReply(reply.replies);
          if (nested) return true;
        }
      }
      return false;
    };

    if (!insertNestedReply(post.replies)) return res.status(404).json({ error: 'Reply not found' });

    await post.save();
    res.status(201).json({ message: 'Reply on reply added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add nested reply' });
  }
});

/**
 * @swagger
 * /api/posts/{postId}/replies/{replyId}/likes:
 *   post:
 *     summary: Toggle like on a reply
 *     tags: [Discussion Forum API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reply like toggled
 *       404:
 *         description: Post or reply not found
 *       500:
 *         description: Failed to toggle like on reply
 */
router.post('/:postId/replies/:replyId/likes', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { postId, replyId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const toggleLike = (replies) => {
      for (let reply of replies) {
        if (reply._id.toString() === replyId) {
          const index = reply.likedBy.indexOf(userId);
          if (index > -1) {
            reply.likedBy.splice(index, 1);
            reply.likes--;
          } else {
            reply.likedBy.push(userId);
            reply.likes++;
          }
          return reply.likes;
        } else if (reply.replies?.length) {
          const result = toggleLike(reply.replies);
          if (result !== null) return result;
        }
      }
      return null;
    };

    const result = toggleLike(post.replies);
    if (result === null) return res.status(404).json({ error: 'Reply not found' });

    await post.save();
    res.json({ message: 'Reply like toggled', likes: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like on reply' });
  }
});

module.exports = router;