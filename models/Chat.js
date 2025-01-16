const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
  _id: String,
  lastMessage: String,
  lastMessageTimestamp: Date,
  participants: [String],
  unreadCount: { type: Number , default: 0 },
});

module.exports = mongoose.model('Chat', ChatSchema);