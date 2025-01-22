const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const defaultUrl =
  'https://images.squarespace-cdn.com/content/v1/6670add926f2a64cd00fb0e7/d2f9b9c1-ab9c-4fe2-a793-d6a8634ac920/character+chii.png';
const crypto = require('crypto');

const { getSessionKeyAndOpenId } = require('../utils/wechatAuth');
/**
 *
 * @param req Request that contains authentication code,
 * user's nickname and avatar information.
 * @param res Response that contains session token, token
 * expiry date and user's id with status code 200 when generation succeed.
 * Else, respond error message with status code 500.
 *
 */
exports.login = async (req, res) => {
  const { auth_code, nickname, avatar_url } = req.body;

  if (!auth_code) {
    return res.status(400).json({ error: 'Missing jsCode in request body' });
  }

  if (!nickname || !avatar_url) {
    console.warn(
      'nickname or avatarUrl not provided by client, defaulting to empty');
    return res.status(400).json({ error: 'Missing nickname or avatarUrl' });
  }

  try {
    const payload = await getSessionKeyAndOpenId(auth_code);
    const userId = crypto.createHash('sha256').
      update(payload.openId).digest('base64').slice(0,7);
    let user = await User.findById(userId);

    if (!user) {
      const expiresIn = 7 * 24 * 60 * 60 * 1000;
      const expire_date = new Date(Date.now() + expiresIn);
      const session_token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.SESSION_EXPIRES,
      });
      const currentTime = new Date();

      user = new User({
        _id: userId,
        sessionToken: session_token,
        nickname: nickname,
        avatarUrl: avatar_url === 'url' ? defaultUrl : avatar_url,
      });

      const dummyChat = new Chat({
        _id: `${userId}chat0`,
        lastMessage: `Welcome ${nickname}!`,
        lastMessageTimestamp: currentTime,
        participants: [userId],
        unreadCount: {
          [userId]: 1,
        }
      })

      const dummyMsg = new Message({
        _id: `${userId}msg0`,
        senderId: userId,
        chatId: dummyChat._id,
        message: `Welcome ${nickname}!`,
        status: 'read',
        timestamp: currentTime,
      })

      await user.save();
      await dummyChat.save();
      await dummyMsg.save();

      res.status(200).json({
        session_token: user.sessionToken,
        expire_date: expire_date,
        user_id: userId,
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
