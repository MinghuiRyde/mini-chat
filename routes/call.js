const express = require('express');
const router = express.Router();
const { creatCall, initCall } = require('../controllers/callController');
const authMiddleware = require('../middlewares/auth');

router.post('/create', authMiddleware, creatCall);
router.post('/init', authMiddleware, initCall);

module.exports = router;