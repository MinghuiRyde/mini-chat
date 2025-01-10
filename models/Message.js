const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
  _id: String,
  senderId: String,
  chatId: String,
  message: String,
  status: String,
  timestamp: Date,
});

MessageSchema.index({ chatId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);