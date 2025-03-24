const jwt = require('jsonwebtoken');
const URL = "https://trtcwebview-develop.rydesharing.com";
const crypto = require('crypto');
const User = require('../models/User');

exports.createCall = async (req, res) => {
    try {
        const { calleeId } = req.body;
        const token = req.headers.authorization.replace('Bearer ', '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = crypto.createHash('sha256')
              .update(payload.openId).digest('base64').slice(0,7);
        const user = await User.findById(userId);
        const callerId = user.callerId || 'unknown';

        const urlToGo = `${URL}/?caller=${callerId}&callee=${calleeId}&call_status=1`;
        console.log('Redirecting to:', urlToGo);
        res.status(200).json({ url: urlToGo });
    } catch (error) {
        console.error('Error in call:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};