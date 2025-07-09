const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true, // Normalize email to lowercase for consistency
        trim: true, // Remove leading/trailing whitespace
        unique: true,
        sparse: true, // Allows null or undefined, but ensures uniqueness where present
        // required: true, // Commented out to allow social auth without email
    },
    phoneNumber: {
        type: String,
        trim: true,
        sparse: true, // Allows null or undefined, ensures uniqueness where present
        unique: true,
        match: [/^\+?[1-9]\d{9,14}$/, 'Please provide a valid phone number in E.164 format (e.g., +12025550123)'], // Basic E.164 validation
    },
    password: {
        type: String,
        required: function () {
            // Required only if not using social auth (email or phone flow)
            return !this.firebaseUid || (!this.email && !this.phoneNumber);
        },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    firebaseUid: {
        type: String,
        required: true,
        index: true, // Index for faster lookup
    },
    displayName: {
        type: String,
        trim: true,
        default: null, // Optional field for social auth names
    },
    avatar: {
        type: String, // URL or base64 string for profile image
        default: null, // Optional field
    },
    role: { type: String, default: 'free', enum: ['free', 'premium', 'VVIP'] }, // Add this line
    provider: {
        type: String,
        enum: ['email', 'phone', 'google', 'apple'], // Track authentication provider
        default: 'email', // Default for email/password flow
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    mt5Login: { type: String },
    mt5Password: { type: String }, // Consider hashing this field
    mt5Server: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update updatedAt on save
userSchema.pre('save', async function (next) {
    this.updatedAt = Date.now();
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Index for email and phoneNumber to improve query performance
// userSchema.index({ email: 1 });
// userSchema.index({ phoneNumber: 1 });

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);