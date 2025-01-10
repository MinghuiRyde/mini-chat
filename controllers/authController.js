const User = require('../models/User');
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
    let user = await User.findById(payload.openid);
    if (!user) {
      const payload = await getSessionKeyAndOpenId(auth_code);
      const expiresIn = 7 * 24 * 60 * 60 * 1000;
      const expire_date = new Date(Date.now() + expiresIn);
      const session_token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: expire_date,
      });

      user = new User({
        _id: payload.openId,
        sessionToken: session_token,
        nickname: nickname,
        avatarUrl: avatar_url
      });

      await user.save();
      res.status(200).json({ session_token: session_token, expire_date: expire_date });
    } else {
      const decoded = jwt.decode(user.sessionToken);
      res.status(200).json({ session_token: user.sessionToken, expire_date: decoded.exp });
    }


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
