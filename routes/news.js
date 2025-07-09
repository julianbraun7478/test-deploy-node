require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Live Breaking News API
/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Fetch live breaking news for Forex, Gold, Cryptos, or Gold Prices
 *     description: Retrieves a list of breaking news items filtered by category, with "All" combining all categories.
 *     tags: [News API]
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [All, Forex, Gold, Cryptos, GoldPrice]
 *           example: All
 *     responses:
 *       '200':
 *         description: Successful response with news items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 news:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "JD Vance says crypto \"has a champion\" in White House at Bitcoin conference"
 *                       description:
 *                         type: string
 *                         example: "Vice President JD Vance praised the Trump administration for embracing the cryptocurrency industry..."
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-28T17:03:47Z"
 *                       category:
 *                         type: string
 *                         enum: [Forex, Gold, Cryptos, GoldPrice]
 *                         example: Cryptos
 *                       url:
 *                         type: string
 *                         example: "https://www.yahoo.com/news/jd-vance-says-crypto-champion-170347225.html"
 *                       urlToImage:
 *                         type: string
 *                         example: "https://s.yimg.com/ny/api/res/1.2/fsbPVgGyi.QUGcWCJgD3nw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD02NzU-/https://media.zenfs.com/en/video.cbsnewsvideos.com/d2a200ecd4b31394afcabec3c980bbd4"
 *                       source:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             nullable: true
 *                           name:
 *                             type: string
 *                             example: "Yahoo Entertainment"
 *                       author:
 *                         type: string
 *                         example: "CBS News Videos"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch news"
 */
router.get('/', async (req, res) => {
  const { category } = req.query;
  const apiKey = process.env.NEWS_API_KEY || 'demo'; // Add to .env

  const categoryUrls = {
    Bitcoins: `https://newsapi.org/v2/everything?q=bitcoin&apiKey=${apiKey}`,
    Cryptos: `https://newsapi.org/v2/everything?q=cryptos&apiKey=${apiKey}`,
    Forex: `https://newsapi.org/v2/everything?q=forex&apiKey=${apiKey}`,
    Gold: `https://newsapi.org/v2/everything?q=gold&apiKey=${apiKey}`,
    // GoldPrice: `https://newsapi.org/v2/everything?q=gold price&apiKey=${apiKey}`,
  };

  try {
    let news = [];

    if (category === 'All' || !category) {
      // Fetch all categories and combine
      const fetchPromises = Object.values(categoryUrls).map(url => axios.get(url));
      const responses = await Promise.all(fetchPromises);
      responses.forEach((response, index) => {
        const cat = Object.keys(categoryUrls)[index];
        const articles = response.data.articles.map(article => ({
          title: article.title,
          description: article.description || 'No description available',
          timestamp: new Date().toISOString(),
          category: cat,
          url: article.url || '',
          urlToImage: article.urlToImage || '',
          source: { id: article.source?.id || null, name: article.source?.name || '' },
          author: article.author || '',
        })).slice(0, 5); // Limit to 5 items per category
        news = news.concat(articles);
      });
    } else if (categoryUrls[category]) {
      // Fetch specific category
      const response = await axios.get(categoryUrls[category]);
      news = response.data.articles.map(article => ({
        title: article.title,
        description: article.description || 'No description available',
        timestamp: new Date().toISOString(),
        category: category,
        url: article.url || '',
        urlToImage: article.urlToImage || '',
        source: { id: article.source?.id || null, name: article.source?.name || '' },
        author: article.author || '',
      })).slice(0, 5); // Limit to 5 items
    } else {
      return res.status(400).json({ error: 'Invalid category' });
    }

    res.json({ news });
  } catch (error) {
    console.error('News Error:', error);
    // Fallback static data
    const fallbackNews = [
      { title: "Gold Hits $3,327 Amid Ceasefire", description: "Gold prices dropped as tensions eased...", timestamp: "2025-06-24T18:38:00Z", category: "Gold", url: "", urlToImage: "", source: { id: null, name: "" }, author: "" },
      { title: "Forex Market Volatility Spikes", description: "USD strengthens post-Fed announcement...", timestamp: "2025-06-24T18:30:00Z", category: "Forex", url: "", urlToImage: "", source: { id: null, name: "" }, author: "" },
      { title: "Bitcoin Surges Past $100K", description: "Crypto market rallies on new upgrade...", timestamp: "2025-06-24T18:25:00Z", category: "Cryptos", url: "", urlToImage: "", source: { id: null, name: "" }, author: "" },
      { title: "Gold Price Forecast Revised", description: "Analysts predict $3,500 by month-end...", timestamp: "2025-06-24T18:20:00Z", category: "GoldPrice", url: "", urlToImage: "", source: { id: null, name: "" }, author: "" },
      { title: "JD Vance says crypto \"has a champion\" in White House at Bitcoin conference", description: "Vice President JD Vance praised the Trump administration for embracing the cryptocurrency industry, saying crypto is a \"hedge against bad policymaking...", timestamp: "2025-05-28T17:03:47Z", category: "Cryptos", url: "https://www.yahoo.com/news/jd-vance-says-crypto-champion-170347225.html", urlToImage: "https://s.yimg.com/ny/api/res/1.2/fsbPVgGyi.QUGcWCJgD3nw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyMDA7aD02NzU-/https://media.zenfs.com/en/video.cbsnewsvideos.com/d2a200ecd4b31394afcabec3c980bbd4", source: { id: null, name: "Yahoo Entertainment" }, author: "CBS News Videos" },
    ];
    if (category === 'All' || !category) {
      news = fallbackNews;
    } else {
      news = fallbackNews.filter(item => item.category === category);
    }
    res.json({ news });
  }
});

module.exports = router;

// require('dotenv').config();
// const express = require('express');
// const router = express.Router();
// const BreakingNews = require('../models/BreakingNews');
// const multer = require('multer');


// // Multer configuration for image upload
// const storage = multer.memoryStorage(); // Store in memory
// const upload = multer({ storage }).single('image'); // Single image upload

// /**
//  * @swagger
//  * /api/news:
//  *   get:
//  *     summary: Fetch breaking news for Forex, Gold, Cryptos, or Gold Prices
//  *     description: Retrieves a list of breaking news items filtered by category, with "All" combining all categories.
//  *     tags: [News API]
//  *     parameters:
//  *       - name: category
//  *         in: query
//  *         required: false
//  *         schema:
//  *           type: string
//  *           enum: [All, Forex, Gold, Cryptos, GoldPrice]
//  *           example: All
//  *     responses:
//  *       '200':
//  *         description: Successful response with news items
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 news:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/NewsItem'
//  *       '400':
//  *         description: Bad request due to invalid category
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "Invalid category"
//  *       '500':
//  *         description: Server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "Internal server error"
//  */

// router.get('/', async (req, res) => {
//   try {
//     const { category } = req.query;
//     let query = {};

//     if (category && category !== 'All') {
//       query.category = category;
//     }

//     const news = await BreakingNews.find(query).sort({ publishDate: -1 });
//     res.json({ news });
//   } catch (error) {
//     console.error('News Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// /**
//  * @swagger
//  * /api/news:
//  *   post:
//  *     summary: Add a new breaking news item
//  *     description: Allows admin to create a new breaking news item with an image and broadcasts it via Socket.IO.
//  *     tags: [News API]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               title:
//  *                 type: string
//  *                 example: "USD Strengthens After Fed Rate Hike"
//  *               description:
//  *                 type: string
//  *                 example: "The USD gained value following the latest Fed decision..."
//  *               category:
//  *                 type: string
//  *                 enum: [Forex, Gold, Cryptos, GoldPrice]
//  *                 example: "Forex"
//  *               publishDate:
//  *                 type: string
//  *                 format: date-time
//  *                 example: "2025-06-27T23:02:00Z"
//  *               author:
//  *                 type: string
//  *                 example: "John Doe"
//  *               image:
//  *                 type: string
//  *                 format: binary
//  *     responses:
//  *       '201':
//  *         description: News item created successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: "News item created"
//  *                 news:
//  *                   $ref: '#/components/schemas/NewsItem'
//  *       '400':
//  *         description: Bad request due to invalid data
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "Invalid category or missing fields"
//  *       '500':
//  *         description: Server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "Failed to process upload"
//  */

// router.post('/', upload, async (req, res) => {
//   try {
//     const { title, description, category, publishDate, author } = req.body;
//     let image = '';

//     if (req.file) {
//       const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
//       const base64Data = req.file.buffer.toString('base64');
//       image = `data:${mimeType};base64,${base64Data}`;
//     }

//     if (!title || !description || !category || !['Forex', 'Gold', 'Cryptos', 'GoldPrice'].includes(category)) {
//       return res.status(400).json({ error: 'Invalid category or missing fields' });
//     }

//     const newNews = new BreakingNews({
//       title,
//       description,
//       category,
//       publishDate: publishDate ? new Date(publishDate) : new Date(),
//       author: author || '',
//       image
//     });

//     await newNews.save();
//     const io = req.app.get('io');// Access io from server.js
//     // Emit new news to all connected frontend clients via Socket.IO
//     io.emit('newBreakingNews', newNews);

//     res.status(201).json({ message: 'News item created', news: newNews });
//   } catch (error) {
//     console.error('News Error:', error);
//     res.status(500).json({ error: 'Failed to process upload' });
//   }
// });

// /**
//  * @swagger
//  * /api/news/{id}:
//  *   put:
//  *     summary: Update a breaking news item
//  *     description: Allows admin to update an existing breaking news item with an image by ID.
//  *     tags: [News API]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         schema:
//  *           type: string
//  *           example: "667e4f8a9b2c3d4e5f6g7h8i"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               title:
//  *                 type: string
//  *                 example: "USD Strengthens After Fed Rate Hike"
//  *               description:
//  *                 type: string
//  *                 example: "The USD gained value following the latest Fed decision..."
//  *               category:
//  *                 type: string
//  *                 enum: [Forex, Gold, Cryptos, GoldPrice]
//  *                 example: "Forex"
//  *               publishDate:
//  *                 type: string
//  *                 format: date-time
//  *                 example: "2025-06-27T23:02:00Z"
//  *               author:
//  *                 type: string
//  *                 example: "John Doe"
//  *               image:
//  *                 type: string
//  *                 format: binary
//  *     responses:
//  *       '200':
//  *         description: News item updated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: "News item updated"
//  *                 news:
//  *                   $ref: '#/components/schemas/NewsItem'
//  *       '404':
//  *         description: News item not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "News item not found"
//  *       '400':
//  *         description: Bad request due to invalid data
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "Invalid category or missing fields"
//  */

// router.put('/:id', upload, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description, category, publishDate, author } = req.body;
//     let image = req.body.image; // Retain existing image if not updated

//     if (req.file) {
//       const mimeType = req.file.mimetype; // e.g., 'image/jpeg'
//       const base64Data = req.file.buffer.toString('base64');
//       image = `data:${mimeType};base64,${base64Data}`;
//     }

//     if (!title || !description || !category || !['Forex', 'Gold', 'Cryptos', 'GoldPrice'].includes(category)) {
//       return res.status(400).json({ error: 'Invalid category or missing fields' });
//     }

//     const updatedNews = await BreakingNews.findByIdAndUpdate(
//       id,
//       {
//         title,
//         description,
//         category,
//         publishDate: publishDate ? new Date(publishDate) : Date.now(),
//         author: author || '',
//         image: image || ''
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedNews) {
//       return res.status(404).json({ error: 'News item not found' });
//     }

//     res.json({ message: 'News item updated', news: updatedNews });
//   } catch (error) {
//     console.error('News Error:', error);
//     res.status(500).json({ error: 'Failed to process upload' });
//   }
// });

// /**
//  * @swagger
//  * /api/news/{id}:
//  *   delete:
//  *     summary: Delete a breaking news item
//  *     description: Allows admin to delete an existing breaking news item by ID.
//  *     tags: [News API]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         schema:
//  *           type: string
//  *           example: "667e4f8a9b2c3d4e5f6g7h8i"
//  *     responses:
//  *       '200':
//  *         description: News item deleted successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: "News item deleted"
//  *       '404':
//  *         description: News item not found
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: "News item not found"
//  */

// router.delete('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedNews = await BreakingNews.findByIdAndDelete(id);

//     if (!deletedNews) {
//       return res.status(404).json({ error: 'News item not found' });
//     }

//     res.json({ message: 'News item deleted' });
//   } catch (error) {
//     console.error('News Error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     NewsItem:
//  *       type: object
//  *       properties:
//  *         _id:
//  *           type: string
//  *           example: "667e4f8a9b2c3d4e5f6g7h8i"
//  *         title:
//  *           type: string
//  *           example: "USD Strengthens After Fed Rate Hike"
//  *         description:
//  *           type: string
//  *           example: "The USD gained value following the latest Fed decision..."
//  *         category:
//  *           type: string
//  *           enum: [Forex, Gold, Cryptos, GoldPrice]
//  *           example: "Forex"
//  *         publishDate:
//  *           type: string
//  *           format: date-time
//  *           example: "2025-06-27T23:02:00Z"
//  *         author:
//  *           type: string
//  *           example: "John Doe"
//  *         image:
//  *           type: string
//  *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
//  */

// module.exports = router;