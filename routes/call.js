const express = require('express');
const router = express.Router();
const { createCall } = require('../controllers/callController');
const authMiddleware = require('../middlewares/auth');

router.post('/create', authMiddleware, createCall);
module.exports = router;