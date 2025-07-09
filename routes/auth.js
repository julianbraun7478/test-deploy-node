const express = require('express');
const { requestVerification, verifyEmail, setPassword, confirmPassword, appleAuth, googleAuth, verifyPhoneNumber, requestPhoneVerification, requestPasswordReset, verifyPasswordReset, resetPassword, login, logout, refresh, protected } = require('../controllers/authController');
const { validateIdentifier, validateCode, validatePassword, validateConfirmPassword, validateNewPassword } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/request-verification:
 *   post:
 *     summary: Request a verification code
 *     description: Sends a verification code to the provided email or phone number.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid input or identifier format
 */
router.post('/request-verification', validateIdentifier, requestVerification);

/**
 * @swagger
 * /api/auth/verify-identifier:
 *   post:
 *     summary: Verify identifier with code
 *     description: Verifies the code sent to the provided email or phone number.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *               code:
 *                 type: string
 *                 description: Verification code (4-10 digits)
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Identifier verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */
router.post('/verify-identifier',  [ validateIdentifier, validateCode], verifyEmail);


/**
 * @swagger
 * /api/auth/set-password:
 *   post:
 *     summary: Set a new password
 *     description: Sets a password for the verified email or phone number.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *               password:
 *                 type: string
 *                 description: Password (minimum 8 characters, at least one number)
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Password set successfully, proceed to confirm
 *       400:
 *         description: Invalid password or identifier
 */
router.post('/set-password', [validateIdentifier, validatePassword], setPassword);

/**
 * @swagger
 * /api/auth/confirm-password:
 *   post:
 *     summary: Confirm password
 *     description: Confirms the password and completes account creation.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *               password:
 *                 type: string
 *                 description: Password
 *                 example: Password123
 *               confirmPassword:
 *                 type: string
 *                 description: Password confirmation
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Account created successfully
 *       400:
 *         description: Passwords do not match or user already exists
 */
router.post('/confirm-password', [validateIdentifier, validatePassword, validateConfirmPassword], confirmPassword);

/**
 * @swagger
 * /api/auth/apple:
 *   post:
 *     summary: Authenticate with Apple
 *     description: Authenticates a user with Apple Sign-In and returns a Firebase token.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Apple ID token from the Sign-In flow
 *                 example: "your-apple-id-token"
 *               name:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *     responses:
 *       200:
 *         description: Apple sign-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid ID token or authentication error
 */
router.post('/apple', appleAuth);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     description: Authenticates a user with Google Sign-In and returns a Firebase token.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from the Sign-In flow
 *                 example: "your-google-id-token"
 *     responses:
 *       200:
 *         description: Google sign-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid ID token or authentication error
 */
router.post('/google', googleAuth);

/**
 * @swagger
 * /api/auth/request-phone-verification:
 *   post:
 *     summary: Request a phone verification code
 *     description: Sends a verification code via SMS to the provided phone number.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +12025550123)
 *                 example: "+12025550123"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid phone number or error sending code
 */
router.post('/request-phone-verification', requestPhoneVerification);

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     summary: Verify phone number with code
 *     description: Verifies the SMS code sent to the provided phone number.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Phone number in E.164 format (e.g., +12025550123)
 *                 example: "+12025550123"
 *               code:
 *                 type: string
 *                 description: Verification code (4 digits)
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Invalid or expired verification code
 */
router.post('/verify-phone', verifyPhoneNumber);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Initiates a password reset process by sending a verification code (email or phone).
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *       400:
 *         description: Invalid identifier or user not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', validateIdentifier, requestPasswordReset);

/**
 * @swagger
 * /api/auth/verify-password-reset:
 *   post:
 *     summary: Verify password reset
 *     description: Verifies the code sent for password reset (phone) or token (email via client).
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *               code:
 *                 type: string
 *                 description: Verification code (4 digits for phone, N/A for email)
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Identifier verified for password reset
 *       400:
 *         description: Invalid or expired verification code
 */
router.post('/verify-password-reset', [validateIdentifier, validateCode], verifyPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets the password for the verified identifier.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or phone number (e.g., +12025550123)
 *                 example: john.smith@gmail.com
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 8 characters, at least one number)
 *                 example: NewPass123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input or user not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', [validateIdentifier, validateNewPassword], resetPassword);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns a JWT token.
 *     tags: [Authentication API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address
 *                 example: john.smith@gmail.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

// /**
//  * @swagger
//  * /api/auth/logout:
//  *   post:
//  *     summary: User logout
//  *     description: Invalidates the user session (client-side).
//  *     tags: [Authentication API]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Logout successful
//  *       500:
//  *         description: Server error
//  */
// router.post('/logout', authenticateToken, logout);

// /**
//  * @swagger
//  * /api/auth/refresh:
//  *   post:
//  *     summary: Refresh JWT token
//  *     description: Refreshes the access token.
//  *     tags: [Authentication API]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Token refreshed
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 token:
//  *                   type: string
//  *       401:
//  *         description: No token provided
//  *       403:
//  *         description: Invalid or expired token
//  *       500:
//  *         description: Server error
//  */
// router.post('/refresh', authenticateToken, refresh);

// /**
//  * @swagger
//  * /api/auth/protected:
//  *   get:
//  *     summary: Access protected route
//  *     description: Requires admin role to access.
//  *     tags: [Authentication API]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Access granted
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 user:
//  *                   type: object
//  *                   properties:
//  *                     uid:
//  *                       type: string
//  *                     email:
//  *                       type: string
//  *                     role:
//  *                       type: string
//  *       401:
//  *         description: No token provided
//  *       403:
//  *         description: Insufficient permissions
//  *       500:
//  *         description: Server error
//  */
// router.get('/protected', ...protected);

module.exports = router;