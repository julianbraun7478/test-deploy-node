const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User'); // Hypothetical User model
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const { authenticateToken } = require('../middleware/auth');

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const scheduledJobs = new Map();

// Create Notification API
/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     description: Adds a notification for specific audiences (All Users, Premium Users, Free Users, VVIP Users) with optional email and scheduling.
 *     tags: [Notifications API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Update"
 *               message:
 *                 type: string
 *                 example: "Check out the latest features!"
 *               audience:
 *                 type: string
 *                 example: "Premium Users"
 *               sendEmail:
 *                 type: boolean
 *                 example: true
 *               scheduleDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-28T14:00:00Z"
 *               type:
 *                 type: string
 *                 example: "CustomType"
 *     responses:
 *       '201':
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification created successfully"
 *                 notification:
 *                   type: object
 *                   properties: {}
 *       '400':
 *         description: Bad request due to missing parameters or invalid type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Title, message, and audience are required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to create notification"
 */
router.post('/', async (req, res) => {
  const { title, message, audience, sendEmail, scheduleDate, type } = req.body;
  
  // Validate required fields
  if (!title || !message || !audience) {
    return res.status(400).json({ error: 'Title, message, and audience are required' });
  }

  if (audience && !['All Users', 'Premium Users', 'Free Users', 'VVIP Users'].includes(audience)) {
    return res.status(400).json({ error: 'Invalid audience' });
  }

  try {
    const currentDate = new Date();
    const notification = new Notification({
      title,
      message,
      audience,
      type: type || 'Normal',
      scheduleDate: scheduleDate ? new Date(scheduleDate) : undefined
    });

    await notification.save();

    // Handle immediate notification if no scheduleDate, or schedule it
    const io = req.app.get('io');
    if (!notification.scheduleDate) {
      const users = await User.find();
      if (audience === 'All Users') {
        io.emit('newNotification', notification);
        if (sendEmail) {
          const allUsers = await User.find();
          for (const user of allUsers) {
            if (user.email) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: title,
                text: message
              });
            }
          }
        }
      } else if (audience === 'Free Users') {
        const freeUsers = await User.find({ $or: [{ subscriptionType: 'free' }, { subscriptionType: { $exists: false } }] });
        freeUsers.forEach(async (user) => {
          io.to(user._id.toString()).emit('newNotification', notification);
          if (sendEmail && user.email) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: title,
              text: message
            });
          }
        });
      } else if (audience === 'Premium Users') {
        const premiumUsers = await User.find({ subscriptionType: 'premium' });
        premiumUsers.forEach(async (user) => {
          io.to(user._id.toString()).emit('newNotification', notification);
          if (sendEmail && user.email) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: title,
              text: message
            });
          }
        });
      } else if (audience === 'VVIP Users') {
        const vvipUsers = await User.find({ subscriptionType: 'VVIP' });
        vvipUsers.forEach(async (user) => {
          io.to(user._id.toString()).emit('newNotification', notification);
          if (sendEmail && user.email) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: title,
              text: message
            });
          }
        });
      }
    } else {
      const job = schedule.scheduleJob(notification._id.toString(), notification.scheduleDate, async () => {
        const io = req.app.get('io');
        const users = await User.find();
        if (audience === 'All Users') {
          io.emit('newNotification', notification);
          if (sendEmail) {
            const allUsers = await User.find();
            for (const user of allUsers) {
              if (user.email) {
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: user.email,
                  subject: title,
                  text: message
                });
              }
            }
          }
        } else if (audience === 'Free Users') {
          const freeUsers = await User.find({ $or: [{ subscriptionType: 'free' }, { subscriptionType: { $exists: false } }] });
          freeUsers.forEach(async (user) => {
            io.to(user._id.toString()).emit('newNotification', notification);
            if (sendEmail && user.email) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: title,
                text: message
              });
            }
          });
        } else if (audience === 'Premium Users') {
          const premiumUsers = await User.find({ subscriptionType: 'premium' });
          premiumUsers.forEach(async (user) => {
            io.to(user._id.toString()).emit('newNotification', notification);
            if (sendEmail && user.email) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: title,
                text: message
              });
            }
          });
        } else if (audience === 'VVIP Users') {
          const vvipUsers = await User.find({ subscriptionType: 'VVIP' });
          vvipUsers.forEach(async (user) => {
            io.to(user._id.toString()).emit('newNotification', notification);
            if (sendEmail && user.email) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: title,
                text: message
              });
            }
          });
        }
        // Optionally clean up the job after execution
        scheduledJobs.delete(notification._id.toString());
      });
      scheduledJobs.set(notification._id.toString(), job);
    }

    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (error) {
    console.error('Notification Error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get All Notifications API
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve all notifications for a user
 *     description: Fetches all notifications for the specified userId, filterable by type.
 *     tags: [Notifications API]
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "user123"
 *       - name: type
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "CustomType"
 *     responses:
 *       '200':
 *         description: Successful response with notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items: {}
 *       '400':
 *         description: Bad request due to missing userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "userId is required"
 */
router.get('/', authenticateToken, async (req, res) => {
  const { type } = req.query;

  const userId = req.user.id;

  try {
    const query = { userId };
    if (type) query.type = type;
    const notifications = await Notification.find(query).sort({ timestamp: -1 });
    res.json({ notifications });
  } catch (error) {
    console.error('Notification Error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Mark Notification as Read API
/**
 * @swagger
 * /api/notifications/{id}:
 *   put:
 *     summary: Mark a notification as read
 *     description: Updates the isRead status of a specific notification.
 *     tags: [Notifications API]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: "60d5f8c8a9b1b8c1c8e4f4f4"
 *     responses:
 *       '200':
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read"
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       '404':
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Notification not found"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to update notification"
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Notification Error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Send Notification to Individual Email API
/**
 * @swagger
 * /api/notifications/email:
 *   post:
 *     summary: Send a notification to an individual user's email
 *     description: Sends a notification email to a specific user's email address with optional scheduling and Socket.IO notification.
 *     tags: [Notifications API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user123"
 *               title:
 *                 type: string
 *                 example: "Personal Update"
 *               message:
 *                 type: string
 *                 example: "This is a personal message for you!"
 *               scheduleDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-28T14:00:00Z"
 *     responses:
 *       '201':
 *         description: Notification created and scheduled/email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Notification created successfully"
 *                 notification:
 *                   type: object
 *                   properties: {}
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
 *                   example: "Failed to create notification"
 */
router.post('/email', async (req, res) => {
  const { userId, title, message, scheduleDate } = req.body;

  if (!userId || !title || !message) {
    return res.status(400).json({ error: 'userId, title, and message are required' });
  }
  

  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentDate = new Date();
    console.log(currentDate);
    const notification = new Notification({
      title,
      message,
      audience: `Individual User: ${user.displayName}`, // Include user's name in audience
      type: 'Personal', // Default type for individual notifications
      scheduleDate: scheduleDate ? new Date(scheduleDate) : undefined
    });

    await notification.save();

    const io = req.app.get('io');
    if (!notification.scheduleDate) {
      io.to(userId).emit('newNotification', notification);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: title,
        text: message
      });
      res.status(201).json({ message: 'Notification created and email sent successfully', notification });
    } else {
      const job = schedule.scheduleJob(notification._id.toString(), notification.scheduleDate, async () => {
        io.to(userId).emit('newNotification', notification);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: title,
          text: message
        });
        scheduledJobs.delete(notification._id.toString());
      });
      scheduledJobs.set(notification._id.toString(), job);
      res.status(201).json({ message: 'Notification created and scheduled successfully', notification });
    }
  } catch (error) {
    console.error('Notification Error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;