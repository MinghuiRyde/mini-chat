const express = require('express');
const router = express.Router();
const createChatAuthMiddleware = require('../middlewares/createChatAuth');
const getChatAuthMiddleware = require('../middlewares/getChatsAuth');
const authMiddleware = require('../middlewares/auth');
const {getChatsByUser, createChat, updateReadStatus} =
  require('../controllers/chatsController');

router.get('/:user_id', getChatAuthMiddleware, getChatsByUser);
router.post('/create', createChatAuthMiddleware, createChat);
router.post('/updateReadStatus', authMiddleware, updateReadStatus);

module.exports = router;