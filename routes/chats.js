const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getChatsByUser, createChat } = require('../controllers/chatsController');

router.get('/:user_id', authMiddleware, getChatsByUser);
router.post('/create', authMiddleware, createChat);

module.exports = router;