const mongoose = require('mongoose');

// Include the timestamp for the user when creating.

const UserSchema = mongoose.Schema({
  _id: String,
  sessionToken: String,
  nickname: String,
  avatarUrl: String,
});

module.exports = mongoose.model('User', UserSchema);