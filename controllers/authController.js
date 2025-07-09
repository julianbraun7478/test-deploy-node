const admin = require('../config/firebase');
require('dotenv').config();
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCredential, OAuthProvider } = require('firebase/auth');
const firebaseClient = require('firebase/app');
const { sendVerificationCode, verifyCode } = require('../services/emailService');
const User = require('../models/User');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const jwt = require('jsonwebtoken');

// In-memory store for Twilio verification codes (replace with Redis in production)
const verificationCodes = new Map();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  // iosClientId: process.env.FIREBASE_IOS_CLIENT_ID, // e.g., "com.example.app.ios"
  // androidClientId: process.env.FIREBASE_ANDROID_CLIENT_ID, // e.g., "com.example.app.android"
};

firebaseClient.initializeApp(firebaseConfig);
const auth = getAuth();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, uid: user.firebaseUid, isAdmin: user.role === 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.checkUser = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.requestVerification = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier (email or phone number) is required' });
    }

    const existingUser = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this identifier already exists' });
    }

    if (identifier.includes('@')) {
      await sendVerificationCode(identifier);
    } else {
      const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
      if (!/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (e.g., +12025550123)' });
      }
      await twilio.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: 'sms', customCodeLength: 4 });
    }
    res.status(200).json({ message: 'Verification code sent to your identifier' });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(400).json({ error: error.message || 'Failed to send verification code' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and code are required' });
    }

    if (identifier.includes('@')) {
      if (!verifyCode(identifier, code)) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }
      res.status(200).json({ message: 'Email verified successfully', identifier });
    } else {
      const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
      const verificationCheck = await twilio.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code });
      if (verificationCheck.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }
      res.status(200).json({ message: 'Phone number verified successfully', identifier });
    }
  } catch (error) {
    console.error('Verify identifier error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify identifier' });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }
    if (!password.match(/^(?=.*[0-9]).{8,}$/)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include a number' });
    }
    let userCredential;
    let provider = identifier.includes('@') ? 'email' : 'phone';
    if (identifier.includes('@')) {
      userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
    } else {
      userCredential = { user: { uid: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } };
    }
    const user = userCredential.user;
    const idToken = identifier.includes('@') ? await user.getIdToken() : null;
    res.status(201).json({
      message: 'Password set successfully, proceed to confirm',
      user: { uid: user.uid, identifier, provider },
      token: idToken,
    });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.confirmPassword = async (req, res) => {
  try {
    const { identifier, password, confirmPassword } = req.body;
    if (!identifier || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Identifier, password, and confirmPassword are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    let user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    let firebaseUid;
    let provider = identifier.includes('@') ? 'email' : 'phone';
    if (identifier.includes('@')) {
      const firebaseUser = await admin.auth().getUserByEmail(identifier);
      firebaseUid = firebaseUser.uid;
    } else {
      firebaseUid = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    user = new User({
      [identifier.includes('@') ? 'email' : 'phoneNumber']: identifier,
      password,
      isVerified: true,
      firebaseUid,
      provider,
    });
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      message: 'Account created successfully',
      user: { identifier, uid: firebaseUid, provider },
      token,
    });
  } catch (error) {
    console.error('Confirm password error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.appleAuth = async (req, res) => {
  try {
    const { idToken, name } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const appleProvider = new OAuthProvider('apple.com');
    const credential = appleProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    const user = userCredential.user;
    const firebaseUid = user.uid;

    let existingUser = await User.findOne({ firebaseUid });
    if (!existingUser) {
      existingUser = new User({
        email: user.email || `${firebaseUid}@apple.com`,
        firebaseUid,
        isVerified: true,
        provider: 'apple',
        role: 'user',
        createdAt: new Date(),
      });
      if (name) {
        existingUser.displayName = `${name.firstName} ${name.lastName || ''}`.trim();
      }
      await existingUser.save();
    } else if (!existingUser.displayName && name) {
      existingUser.displayName = `${name.firstName} ${name.lastName || ''}`.trim();
      await existingUser.save();
    }

    const token = generateToken(existingUser);
    res.status(200).json({
      message: 'Apple sign-in successful',
      user: { uid: firebaseUid, email: user.email, displayName: existingUser.displayName, provider: 'apple', role: existingUser.role },
      token,
    });
  } catch (error) {
    console.error('Apple authentication error:', error);
    res.status(400).json({ error: error.message || 'Failed to authenticate with Apple' });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    let existingUser = await User.findOne({ firebaseUid });
    if (!existingUser) {
      existingUser = new User({
        email: decodedToken.email,
        firebaseUid,
        isVerified: true,
        displayName: decodedToken.name,
        provider: 'google',
        createdAt: new Date(),
      });
      await existingUser.save();
    } else if (!existingUser.displayName) {
      existingUser.displayName = decodedToken.name;
      await existingUser.save();
    }

    const token = generateToken(existingUser);
    res.status(200).json({
      message: 'Google sign-in successful',
      user: { uid: firebaseUid, email: decodedToken.email, displayName: existingUser.displayName, provider: 'google' },
      token,
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(400).json({ error: error.message || 'Failed to authenticate with Google' });
  }
};

exports.requestPhoneVerification = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Phone Number is required' });
    }

    const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
    if (!/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (e.g., +12025550123)' });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: 'sms', customCodeLength: 4 });

    const verification = { sid: `VC${Math.random().toString(36).substr(2, 8)}`, expires: Date.now() + 10 * 60 * 1000 };
    verificationCodes.set(phoneNumber, verification);

    res.status(200).json({ message: 'Verification code sent to your identifier' });
  } catch (error) {
    console.error('Phone verification request error:', error);
    res.status(400).json({ error: error.message || 'Failed to send verification code' });
  }
};

exports.verifyPhoneNumber = async (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and code are required' });
    }

    const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
    const record = verificationCodes.get(phoneNumber);
    if (!record || record.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const verificationCheck = await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phoneNumber, code });
    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    verificationCodes.delete(phoneNumber);

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        isVerified: true,
        firebaseUid: `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider: 'phone',
      });
      await user.save();
    }

    const token = generateToken(user);
    res.status(200).json({ message: 'Phone number verified successfully', token });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify phone number' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier (email or phone number) is required' });
    }

    if (identifier.includes('@')) {
      await sendVerificationCode(identifier);
      res.status(200).json({ message: 'Verification code sent to your email for password reset. Check your inbox.' });
    } else {
      const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
      if (!/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format. Use E.164 (e.g., +12025550123)' });
      }

      await twilio.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: 'sms', customCodeLength: 4 });

      const verification = { sid: `VC${Math.random().toString(36).substr(2, 8)}`, expires: Date.now() + 10 * 60 * 1000 };
      verificationCodes.set(phoneNumber, verification);

      res.status(200).json({ message: 'Verification code sent to your phone for password reset' });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(400).json({ error: error.message || 'Failed to initiate password reset' });
  }
};

exports.verifyPasswordReset = async (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      return res.status(400).json({ error: 'Identifier and code are required' });
    }

    if (identifier.includes('@')) {
      if (!verifyCode(identifier, code)) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }
      res.status(200).json({ message: 'Email verified for password reset', identifier });
    } else {
      const phoneNumber = identifier.startsWith('+') ? identifier : `+${identifier}`;
      const record = verificationCodes.get(phoneNumber);
      if (!record || record.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      const verificationCheck = await twilio.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code });
      if (verificationCheck.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      verificationCodes.delete(phoneNumber);
      res.status(200).json({ message: 'Phone number verified for password reset', identifier });
    }
  } catch (error) {
    console.error('Password reset verification error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify for password reset' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier || !newPassword) {
      return res.status(400).json({ error: 'Identifier and new password are required' });
    }
    if (!newPassword.match(/^(?=.*[0-9]).{8,}$/)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include a number' });
    }

    let user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (identifier.includes('@')) {
      await admin.auth().updateUser(user.firebaseUid, { password: newPassword });
    }
    user.password = newPassword;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({ message: 'Password reset successfully', token });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    let userCredential;
    if (identifier.includes('@')) {
      userCredential = await signInWithEmailAndPassword(auth, identifier, password);
    } else {
      return res.status(400).json({ error: 'Phone login not supported yet' });
    }

    const user = userCredential.user;
    const dbUser = await User.findOne({ firebaseUid: user.uid });

    const token = generateToken(dbUser /* || { _id: user.uid, firebaseUid: user.uid, role: 'user' } */);
    res.status(200).json({
      message: 'Login successful',
      user: { uid: user.uid, email: user.email, role: dbUser?.role || 'user' },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Invalid credentials' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied, no token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });

      const newToken = generateToken({ _id: decoded.id, firebaseUid: decoded.uid, role: decoded.isAdmin ? 'admin' : 'user' });
      res.status(200).json({ token: newToken });
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.protected = [
//   authenticateToken,
  async (req, res) => {
    try {
      res.status(200).json({ message: 'Access granted', user: req.user });
    } catch (error) {
      console.error('Protected route error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
];