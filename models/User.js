const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  _id: String,
  sessionToken: String,
  nickname: String,
  avatarUrl: String,
});

module.exports = mongoose.model('User', UserSchema);