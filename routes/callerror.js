const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    console.log('Call Error:', req.body);
    res.status(200).json({ message: 'Call Error Received' });
});

module.exports = router;