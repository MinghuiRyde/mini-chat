const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getRecipients } = require('../controllers/recipientsController');

router.get('/:recipient_id', authMiddleware, getRecipients);

module.exports = router;