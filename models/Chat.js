const mongoose = require('mongoose');

const ChatSchema = mongoose.Schema({
  _id: String,
  lastMessage: String,
  lastMessageTimestamp: Date,
  participants: [String],
  unreadCount: Object,
});

module.exports = mongoose.model('Chat', ChatSchema);