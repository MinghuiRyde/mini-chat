const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getMessagesByChatId } = require('../controllers/messageController');

router.get('/', authMiddleware, getMessagesByChatId);

module.exports = router;