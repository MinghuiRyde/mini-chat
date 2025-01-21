const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const deleteChatOrMessage = require('../controllers/deleteController');

router.post('/delete', authMiddleware, deleteChatOrMessage);

module.exports = router;