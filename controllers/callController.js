const jwt = require('jsonwebtoken');
const URL = "https://trtcwebview-develop.rydesharing.com";
const crypto = require('crypto');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { sendSubscriptionMessage } = require('./subscriptionMessageController');

exports.createCall = async (req, res) => {
    try {
    
        const { chat_id } = req.body;
        const token = req.headers.authorization.replace('Bearer ', '');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = crypto.createHash('sha256')
              .update(payload.openId).digest('base64').slice(0,7);
        const user = await User.findById(userId);
        if (!user) {
            console.error('No such user:', userId);
            return res.status(400).json({ message: 'User does not exist' });
        }

        const callerId = user.callerId || 'unknown';
        const chat = await Chat.findById(chat_id);
        if (!chat) {
            console.error('No such chat:', chat_id);
            return res.status(400).json({ message: 'Chat does not exist' });
        }

        const calleeUserId = chat.participants.find(participant => participant !== userId);
        const callee = await User.findById(calleeUserId);
        if (!callee) {
            console.error('No such user:', calleeUserId);
            return res.status(400).json({ message: 'User does not exist' });
        }

        const calleeId = callee.callerId || 'unknown';
        const calleeToken = callee.sessionToken;
        const calleePayload = jwt.verify(calleeToken, process.env.JWT_SECRET);

        const urlToGo = `${URL}/?caller=${callerId}&callee=${calleeId}&call_status=1`;
        console.log('Redirecting to:', urlToGo);
        res.status(200).json({ url: urlToGo });
        sendSubscriptionMessage({
            thing2: { value: 'incomingCall' },
            thing5: { value: 'blahblahblah' },
            car_number4: { value: 'ryde123' },
        }, calleePayload.openId);
        console.log('Subscription message sent to callee:', calleePayload.openId);
    } catch (error) {
        console.error('Error in call:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};