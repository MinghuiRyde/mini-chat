const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * 
 * @param req Request with header containing authentication token.
 * @param res Response with error message when no or invalid token is provided.
 * @param next Pass control to the next function.
 * 
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("authHeader", authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401)
      .json({ error: 'No or invalid authentication token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = crypto.createHash('sha256')
      .update(decoded.openId).digest('base64').slice(0,7);
    console.log("userId", userId);
    const user = await User.findById(userId);

    // Check if the token is valid or expired
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (user.sessionToken !== token) {
      console.log("user.sessionToken", user.sessionToken);
      console.log("token", token);
      return res.status(401).json({ error: 'Expired token, please login again' });
    }

    req.user = decoded;
    next();
  });
};