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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://mini-chat-rig7.onrender.com/',
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
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat: ${chatId}`);
  });

  //listen to message
  socket.on('sendMessage', async (msgData) => {
    console.log('Received a new message: ', msgData);
    const currentTime = new Date();
    const timeHash = currentTime.toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const msgId = `${timeHash}-${randomStr}`;

    const newMessage = new Message({
      _id: msgId,
      senderId: msgData.senderId,
      chatId: msgData.chatId,
      message: msgData.message,
      status: 'sent',
      timestamp: currentTime,
    });
    await newMessage.save();

    io.to(msgData.chatId).emit('receiveMessage', msgData);
  });

  //disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

// start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));