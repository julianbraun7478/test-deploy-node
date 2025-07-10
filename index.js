const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const authRoutes = require('./routes/auth');
const mt5Routes = require('./routes/mt5');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/review');
const notificationRoutes = require('./routes/notification');
const currencyRoutes = require('./routes/currency'); // New route
const newsRoutes = require('./routes/news');
const goldPriceRoutes = require('./routes/goldprice');
const applicationRoutes = require('./routes/applications');
const signalRoutes = require('./routes/signals');
const JournalRoutes = require('./routes/journalRoutes');
const economicCalendarRoutes = require('./routes/economicCalendar');
const userRoutes =require('./routes/userRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const multer = require('multer');
const path = require('path');
const Journal = require('./models/Journal');
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Attach io to app for use in routes
app.set('io', io);
// Security middleware
app.use(helmet());
app.use(cors());
app.set('trust proxy', 1); // ✅ Securely trust the first proxy

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP
    standardHeaders: true, // Recommended
    legacyHeaders: false,  // Recommended
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads (temporary storage for Base64 conversion)
const storage = multer.memoryStorage(); // Store in memory instead of disk
const upload = multer({ storage }).array('images', 5); // Up to 5 images

app.use('/api/auth', authRoutes);
app.use('/api/mt5', mt5Routes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/convert', currencyRoutes); // New route
app.use('/api/news', newsRoutes);
app.use('/api/goldprice', goldPriceRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/economic-calendar', economicCalendarRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journals', JournalRoutes);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/trading-tips', require('./routes/tradingTipRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/mindfulness-prompts', require('./routes/mindfulnessPromptRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/badges', require('./routes/badge'));
// app.use('/api/subscriptions', require('./routes/subscriptions'));

// Routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sessions', require('./routes/session'));

app.use('/api/tiers', require('./routes/tiers'));
app.use('/api/affiliates', require('./routes/affiliates'));
app.use('/api/affiliate-reports', require('./routes/reports'));
app.get('/api-docs', (req, res) => {
  res.redirect('/swagger.html');
});

app.get('/', (req, res) => {
  res.send('Louis Backend is running!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Socket.IO for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('sendMessage', async (data) => {
    const { sender, receiver, message, isAI } = data;
    if (!sender || !receiver || !message) {
      socket.emit('error', { error: 'Sender, receiver, and message are required' });
      return;
    }

    const Chat = require('./models/Chat'); // Dynamic require to avoid circular dependency
    const newMessage = new Chat({ sender, receiver, message, isAI });
    await newMessage.save();

    io.emit('newMessage', newMessage); // Broadcast to all clients

    if (isAI) {
      const { askAI } = require('./services/openaiService');
      const aiReply = await askAI(message);
      const aiMessage = new Chat({ sender: 'AI', receiver: sender, message: aiReply, isAI: true });
      await aiMessage.save();
      io.emit('newMessage', aiMessage); // Broadcast AI reply
      socket.emit('aiReply', { reply: aiReply }); // Direct reply to sender
    }
  });


  socket.on('sendNotification', async (data) => {
    const { title, message, userId, type = 'Normal' } = data;
    if (!title || !message || !userId) {
      socket.emit('error', { error: 'Title, message, and userId are required' });
      return;
    }

    const Notification = require('./models/Notification');
    const newNotification = new Notification({ title, message, userId, type });
    await newNotification.save();
    io.to(userId).emit('newNotification', newNotification); // Broadcast to specific user room
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;