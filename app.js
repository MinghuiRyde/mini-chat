require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const chatsRoutes = require('./routes/chats');
const recipientsRoutes = require('./routes/recipients');

const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['https://mini-chat-rig7.onrender.com', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  }
});

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    //create indexes for more efficient message history fetching
    await Message.createIndexes();
    console.log('Indexes created for Message model');
  })
  .catch(err => console.log(err));

//routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/recipients', recipientsRoutes);

//sockets
io.on('connection', (socket) => {
  console.log(`Received a new connection: ${socket.id}`);

  //listen to join event
  socket.on('joinChat', (msgData) => {
    if (!msgData || !msgData.chat_id) {
      console.log('Invalid message:', msgData);
      return;
    }
    socket.join(msgData.chat_id);
    console.log(`Socket ${socket.id} joined chat: ${msgData.chat_id}`);
  });

  //listen to message
  socket.on('sendMessage', async (msgData) => {
    console.log('Received a new message: ', msgData);
    if (!msgData || !msgData.sender_id || !msgData.chat_id || !msgData.message) {
      console.error('Invalid sendMessage data:', msgData);
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    const currentTime = new Date();
    const timeHash = currentTime.toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const msgId = `${timeHash}-${randomStr}`;

    const user = await User.findById(msgData.receiver_id);
    if (!user) {
      console.error('User does not exist');
      socket.emit('error', { message: 'User not found.' });
      return;
    }

    const newMessage = new Message({
      _id: msgId,
      senderId: msgData.sender_id,
      chatId: msgData.chat_id,
      message: msgData.message,
      status: 'sent',
      timestamp: currentTime,
    });

    try {
      await newMessage.save();
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to save message' });
      return;
    }

    const resData = {
      sender_id: msgData.sender_id,
      recipients_nickname: user.nickname,
      recipients_avatar_url: user.avatarUrl,
      content: msgData.message,
      timestamp: currentTime,
      status: 'sent',
    }

    io.to(msgData.chatId).emit('receiveMessage', resData);
  });

  //disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

// start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));