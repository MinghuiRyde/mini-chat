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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401)
      .json({ error: 'No token or Invalid token header provided' });
  }

  // Remove bearer header
  const token = authHeader.replace('Bearer ', '');
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const { user_a, user_b } = req.body;
    const userA = await User.findById(user_a);
    const userB = await User.findById(user_b);


    if (!userA || !userB || (userA.sessionToken !== token && userB.sessionToken !== token)) {
      console.error('Expired or Invalid token');
      return res.status(401).json({ error: 'Expired or Invalid token' });
    }

    req.user = decoded;
    next();
  });
};