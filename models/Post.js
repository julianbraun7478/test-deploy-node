const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  avatar: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  replies: [this], // recursive nested replies
  likes: { type: Number, default: 0 },
  likedBy: [String]
});

const postSchema = new mongoose.Schema({
  message: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String, ref: 'User' }], // Array of userIds who liked the post
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true, ref: 'User' },
  name: { type: String, required: true },
  avatar: {
    type: String, // URL or base64 string for profile image
    default: null, // Optional field
},
});

module.exports = mongoose.model('Post', postSchema);