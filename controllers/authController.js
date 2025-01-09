const User = require('../models/User');
const jwt = require('jsonwebtoken');

const { getSessionKeyAndOpenId } = require('../utils/wechatAuth');

exports.login = async (req, res) => {
  const { jsCode, nickname, avatarUrl } = req.body;

  if (!jsCode) {
    return res.status(400).json({ error: 'Missing jsCode in request body' });
  }

  if (!nickname || !avatarUrl) {
    console.warn('nickname or avatarUrl not provided by client, defaulting to empty');
    return res.status(400).json({ error: 'Missing nickname or avatarUrl' });
  }

  try {
    const payload = await getSessionKeyAndOpenId(jsCode);
    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const expiresDate = new Date(Date.now() + expiresIn);
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.SESSION_EXPIRES,
    });


    let user = await User.findById(payload.openid);
    if (!user) {
      user = new User({
        _id: payload.openId,
        sessionToken: token,
        nickname: nickname,
        avatarUrl: avatarUrl
      });

      await user.save();
    }

    res.status(200).json({ token, expiresDate });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
