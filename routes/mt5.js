const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL;

/**
 * @swagger
 * /api/mt5/connect:
 *   post:
 *     summary: Connect to an MT5 account and retrieve analytics data
 *     description: Connects to the MT5 account using provided credentials and returns account information, positions, and recent deals for analytics. No trades are executed.
 *     tags: [Authentication API]    
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               server:
 *                 type: string
 *                 example: "ICMarketsSC-Demo"
 *               login:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 example: "yourpassword"
 *     responses:
 *       200:
 *         description: Successful response with MT5 analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account_information:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 1000.50
 *                     equity:
 *                       type: number
 *                       example: 1005.25
 *                     margin:
 *                       type: number
 *                       example: 50.00
 *                     free_margin:
 *                       type: number
 *                       example: 955.25
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                         example: "EURUSD"
 *                       volume:
 *                         type: number
 *                         example: 0.1
 *                       profit:
 *                         type: number
 *                         example: 2.50
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticket:
 *                         type: number
 *                         example: 123456789
 *                       symbol:
 *                         type: string
 *                         example: "EURUSD"
 *                       profit:
 *                         type: number
 *                         example: 1.75
 *       400:
 *         description: Bad request due to missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server, login, and password are required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "MT5 connection failed"
 */

router.post('/connect', authenticateToken, async (req, res) => {
    // const { server, account, password } = req.body;

    // if (!server || !account || !password) {
    //     return res.status(400).json({ error: 'Server, account, and password are required' });
    // }

    // const pythonProcess = spawn('python', ['mt5_connector.py', server, account, password]);
    // console.log(pythonProcess);
    // let output = '';
    // pythonProcess.stdout.on('data', (data) => {
    //     output += data.toString();
    // });

    // pythonProcess.stderr.on('data', (data) => {
    //     console.error(`Error: ${data}`);
    // });

    // pythonProcess.on('close', (code) => {
    //     if (code === 0) {
    //         try {
    //             const result = JSON.parse(output);
    //             res.json(result);
    //         } catch (e) {
    //             res.status(500).json({ error: 'Failed to parse MT5 data' });
    //         }
    //     } else {
    //         res.status(500).json({ error: 'MT5 connection failed' });
    //     }
    // });

    try {
        const { login, password, server } = req.body;

        const response = await axios.post(`${PYTHON_SERVER_URL}/connect`, {
            login,
            password,
            server,
        });

        // Extract user ID from authenticated request (assuming JWT or similar middleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Update user document with MT5 credentials
        await User.findByIdAndUpdate(userId, {
            mt5Login: login,
            mt5Password: password, // Consider hashing this field for security
            mt5Server: server,
        }, { new: true, runValidators: true });

        res.json(response.data);
    } catch (err) {
        console.error("MT5 connect error:", err.message);
        res.status(500).json({ error: "Failed to connect to MT5", detail: err.response?.data });
    }
});

module.exports = router;