const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
  _id: String,
  senderId: String,
  chatId: String,
  message: String,
  status: String,
  timestamp: Date,
});

module.exports = mongoose.model('Message', MessageSchema);