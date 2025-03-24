const jwt = require('jsonwebtoken');
const URL = "https://trtcwebview-develop.rydesharing.com";

exports.createCall = async (req, res) => {
    try {
        const { calleeId } = req.body;
        const token = req.headers.authorization.replace('Bearer ', '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const callerId = payload.callerId;

        const urlToGo = `${URL}/?caller=${callerId}&callee=${calleeId}&call_status=1`;
        console.log('Redirecting to:', urlToGo);
        res.status(200).json({ url: urlToGo });
    } catch (error) {
        console.error('Error in call:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};