require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const chatsRoutes = require('./routes/chats');
const recipientsRoutes = require('./routes/recipients');

const http = require('http');
const { WebSocket } = require('ws');
const Message = require('./models/Message');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

const chatRooms = new Map();

//websockets
wss.on('connection', (ws) => {
  console.log('New connection established');

  ws.on('message', async (data) => {
    let parsedData;

    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.log("Failed to parse", error);
      return;
    }
    const { event } = parsedData;

    switch (event) {
      case 'joinChat':
        handleJoinChat(ws, parsedData);
        break;
      case 'sendMessage':
        await handleSendMessage(ws, parsedData);
        break;
      default:
        console.log('Received unknown event:', event);
    }
  });

  ws.on('close', () => {
    console.log('Disconnected');
    removeSocketFromRooms(ws);
  });
});

function removeSocketFromRooms(ws) {
  for (const [chatId, sockets] of chatRooms.entries()) {
    const index = sockets.indexOf(ws);
    if (index !== -1) {
      sockets.splice(index, 1);
      if (sockets.length === 0) {
        chatRooms.delete(chatId);
      }
    }
  }
}

function handleJoinChat(ws, { chat_id }) {
  if (!chat_id) {
    console.log('Chat ID is missing');
    return;
  }

  console.log('Client joined chat:', chat_id);

  if (!chatRooms.has(chat_id)) {
    chatRooms.set(chat_id, []);
  }

  chatRooms.get(chat_id).push(ws);

  ws.currentChatId = chat_id;
}

async function handleSendMessage(ws, msgData) {
  console.log('Received a new message:', msgData);

  const { sender_id, chat_id, message } = msgData;

  if (!sender_id || !chat_id || !message) {
    console.error('Invalid message data:', msgData);
    sendError(ws, 'Invalid message data');
    return;
  }

  let chat = await Chat.findById(chat_id);
  if (!chat) {
    console.error('No such chat:', chat_id);
    sendError(ws, 'Chat does not exist');
    return;
  }

  let userId = chat.participants.find(participant => participant !== sender_id);
  userId = userId ? userId : sender_id;

  const currentTime = new Date();
  const timeHash = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  const msgId = `${timeHash}-${randomStr}`;

  const newMessage = new Message({
    _id: msgId,
    senderId: sender_id,
    chatId: chat_id,
    message: message,
    status: 'sent',
    timestamp: currentTime,
  })

  // format to be decided
  const resData = {
    event: 'receiveMessage',
    sender_id: sender_id,
    recipients_id: userId,
    content: message,
    timestamp: currentTime,
    status: 'sent',
  }

  try {
    await newMessage.save();
  } catch (error) {
    console.error('Error saving message:', error);
    sendError(ws, 'Failed to save message');
    return;
  }

  //send message to the room
  const room = chatRooms.get(chat_id) || [];
  if (room.length === 1) {
    room[0].send(JSON.stringify(resData));
  } else {
    room.forEach((clientWs) => {
      if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(resData));
      }
    });
  }
  newMessage.status = 'delivered';
  console.log('sent new message at:', currentTime);
  // update last message and its time for chat
  chat.lastMessage = message;
  chat.lastMessageTimestamp = currentTime;
  chat.unreadCount[userId] = (chat.unreadCount[userId] || 0) + 1;
  chat.markModified('unreadCount');

  try {
    await newMessage.save();
    await chat.save();
  } catch (error) {
    console.error('Error saving chat:', error);
    sendError(ws, 'Failed to save chat');
  }
}

function sendError(ws, message) {
  ws.send(JSON.stringify({
    event: 'error',
    message,
  }));
}

// start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));