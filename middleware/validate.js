const { body, validationResult } = require('express-validator');

const validateIdentifier = [
  body('identifier')
    .custom((value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[1-9]\d{9,14}$/; // Basic E.164 format check
      if (!emailRegex.test(value) && !phoneRegex.test(value)) {
        throw new Error('Invalid email or phone number format');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

const validateCode = [
  body('code').isLength({ min: 4, max: 10 }).withMessage('Code must be 4-10 digits'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

const validatePassword = [
  body('password').matches(/^(?=.*[0-9]).{8,}$/).withMessage('Password must be at least 8 characters and include a number'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

const validateNewPassword = [
    body('newPassword').matches(/^(?=.*[0-9]).{8,}$/).withMessage('Password must be at least 8 characters and include a number'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      next();
    },
  ];

const validateConfirmPassword = [
  body('password').notEmpty().withMessage('Password is required'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
];

module.exports = { validateIdentifier, validateCode, validatePassword, validateConfirmPassword, validateNewPassword };