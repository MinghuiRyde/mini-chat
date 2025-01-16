const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const {getChatsByUser, createChat, updateReadStatus, updateDeliveredStatus}
  = require('../controllers/chatsController');

router.get('/:user_id', authMiddleware, getChatsByUser);
router.post('/create', authMiddleware, createChat);
router.post('/updateReadStatus', authMiddleware, updateReadStatus);
router.post('/updateDeliveredStatus', authMiddleware, updateDeliveredStatus);

module.exports = router;