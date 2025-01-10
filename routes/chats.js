const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getChatsByUser } = require('../controllers/chatsController');

router.get('/:user_id', authMiddleware, getChatsByUser);

module.exports = router;