const User = require('../models/user');
const jwt = require('jsonwebtoken');

const { getSessionKeyAndOpenId } = require('../utils/wechatAuth');

exports.login = async (req, res) => {
  const { jsCode } = req.body;

  if (!jsCode) {
    return res.status(400).json({ error: 'Missing jsCode in request body' });
  }

  try {
    const payload = await getSessionKeyAndOpenId(jsCode);
    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const expiresDate = new Date(Date.now() + expiresIn);
    const token = jwt.sign(payload, process.env.SESSION_SECRET, {
      expiresIn: process.env.SESSION_EXPIRES,
    });


    let user = await User.findById(payload.openid);
    if (!user) {
      user = new User({
        _id: payload.openid,
        sessionToken: token,
        nickname: nickname || '',
        avatarUrl: avatarUrl || ''
      });
    }

    await user.save();

    res.status(200).json({ token, expiresDate });

  } catch (err) {
    console.log('Login failed with error: ', err.message);
    res.status(500).json({ error: err.message });
  }
};
