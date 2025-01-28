const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/getMessageAuth');
const { getMessagesByChatId } = require('../controllers/messageController');

router.get('/', authMiddleware, getMessagesByChatId);

module.exports = router;