const nodemailer = require('nodemailer');
require('dotenv').config();
const { generateVerificationCode } = require('../utils/codeGenerator');

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (e.g., Gmail, SendGrid)
    auth: {
        user: process.env.EMAIL_USER, // e.g., your-email@gmail.com
        pass: process.env.EMAIL_PASS, // App-specific password or API key
    },
});

let verificationCodes = {}; // In-memory store (replace with Redis in production)

const sendVerificationCode = async (email) => {
    const code = generateVerificationCode();
    verificationCodes[email] = code;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email for Louis App',
        text: `Your verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
    };

    await transporter.sendMail(mailOptions);
    setTimeout(() => delete verificationCodes[email], 10 * 60 * 1000); // Expire after 10 minutes
    return code;
};

const sendPasswordResetEmail = async (email, token) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password for Louis App',
        text: `You are receiving this because you (or someone else) have requested a password reset.\n\n
        Please click the following link to reset your password:\n\n
        ${process.env.CLIENT_URL}/reset-password/${token}\n\n
        If you did not request this, please ignore this email.\n`,
    };
    await transporter.sendMail(mailOptions);
    return token;
}

const verifyCode = (email, code) => {
    const storedCode = verificationCodes[email];
    return storedCode === code;
};

module.exports = { sendVerificationCode, verifyCode, sendPasswordResetEmail };