const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const { getSessionKeyAndOpenId } = require('../utils/wechatAuth');

exports.login = async (req, res) => {
  const { auth_code, nickname, avatar_url } = req.body;

  if (!auth_code) {
    return res.status(400).json({ error: 'Missing jsCode in request body' });
  }

  if (!nickname || !avatar_url) {
    console.warn('nickname or avatarUrl not provided by client, defaulting to empty');
    return res.status(400).json({ error: 'Missing nickname or avatarUrl' });
  }

  try {

    let user = await User.findById(auth_code);

    if (!user) {
      const payload = await getSessionKeyAndOpenId(auth_code);
      const expiresIn = 7 * 24 * 60 * 60 * 1000;
      const expire_date = new Date(Date.now() + expiresIn);
      const session_token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.SESSION_EXPIRES,
      });
      user = new User({
        _id: auth_code,
        sessionToken: session_token,
        nickname: nickname,
        avatarUrl: avatar_url
      });

      const dummyChat = new Chat({
        _id: `${auth_code}chat0`,
        lastMessage: `Welcome ${nickname}!`,
        lastMessageTimestamp: new Date(),
        participants: [auth_code, auth_code],
        unreadCount: 1,
      })

      const dummyMsg = new Message({
        _id: `${auth_code}msg0`,
        senderId: auth_code,
        chatId: dummyChat._id,
        message: `Welcome ${nickname}!`,
        status: 'read',
        timestamp: new Date(),
      })

      await user.save();
      await dummyChat.save();
      await dummyMsg.save();

      res.status(200).json({
        session_token: user.sessionToken,
        expire_date: expire_date,
        user_id: auth_code,
      });
    } else {
      const decoded = jwt.decode(user.sessionToken);
      const expire_date = new Date(decoded.exp * 1000);
      res.status(200).json({
        session_token: user.sessionToken,
        expire_date: expire_date,
        user_id: user._id,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
