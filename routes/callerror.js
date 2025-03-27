const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');

router.post('/', async (req, res) => {
    try {
        const chatRooms = req.app.locals.chatRooms;
        console.log('Call Error:', req.body);
        const { caller, callee } = req.query;
        console.log('caller:', caller);
        console.log('callee:', callee);

        const callerId = await User.findOne(
            { callerId: caller },
            { _id: 1 }
        );

        const calleeId = await User.findOne(
            { callerId: callee },
            { _id: 1 }
        );
        console.log('callerId:', callerId);
        console.log('calleeId:', calleeId);

        const chat = await Chat.findOne(
            { participants: { $all: [callerId, calleeId] } },
            { _id: 1}
        );

        const chatId = chat ? chat._id : null;
        console.log('chatId:', chatId);
        const room = chatRooms.get(chatId);
        console.log('room size:', room ? room.length : 0);

        room.forEach(socket => {
            socket.send(JSON.stringify({ event: 'call_status_update', message: "init_failed" }));
        });

        console.log("error sent");

        res.status(200).json({ message: 'Call Error Received' });
    } catch (error) {
        console.error('Error in call error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
});

module.exports = router;