require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const chatsRoutes = require('./routes/chats');
const recipientsRoutes = require('./routes/recipients');
const deleteRoutes = require('./routes/delete');

const http = require('http');
const { WebSocket } = require('ws');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.use(express.json());

// Connect app to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    // Create indexes for more efficient message history fetching
    await Message.createIndexes();
    console.log('Indexes created for Message model');
    await Chat.createIndexes();
    console.log('Indexes created for Chat model');
  })
  .catch(err => console.log(err));

// Routes for different API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/recipients', recipientsRoutes);
app.use('/api/delete', deleteRoutes);

const chatRooms = new Map();

// WebSocket connection for chatting
wss.on('connection', (ws) => {
  console.log('New connection established');

  console.log('common room volume: ', wss.clients.size);

  // Handle incoming messages
  ws.on('message', async (data) => {
    let parsedData;

    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.log("Failed to parse", error);
      return;
    }
    const { event } = parsedData;
    try {
      switch (event) {
        case 'joinRoom':
          handleJoinRoom(ws, parsedData);
          break;
        case 'sendMessage':
          await handleSendMessage(ws, parsedData);
          break;
        case 'disconnect':
          removeSocketFromRooms(ws);
          break;
        default:
          console.log('Received unknown event:', event);
      }
    } catch (error) {
      console.log(error);

    }
  });

  // Disconnect WebSocket
  ws.on('close', () => {
    console.log('Disconnected');
    removeSocketFromRooms(ws);
  });
});

/**
 * 
 * Remove the socket from all chat rooms when it disconnects.
 * @param ws websocket to be removed from chat rooms.
 */
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

/**
 * 
 * Join the chat room by adding the websocket.
 * @param ws WebSocket to be added to the chat room.
 * @param param1 Chat ID for the chat room to join.
 */
function handleJoinRoom(ws, { chat_id }) {
  if (!chat_id) {
    console.log('Chat ID is missing');
    return;
  }

  console.log('Client joined chat:', chat_id);
  ws.send(JSON.stringify('Client joined chat:' + chat_id));

  if (!chatRooms.has(chat_id)) {
    chatRooms.set(chat_id, []);
  }

  const room = chatRooms.get(chat_id);
  room.push(ws);

  ws.currentChatId = chat_id;

  const sendData = {
    event: 'updateReadMessages',
  };

  room.forEach(async (clientWs) => {
    if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(sendData));
    }
  });
}

/**
 * 
 * @param ws WebSocket to send the message.
 * @param msgData Message data to be sent.
 * 
 */
async function handleSendMessage(ws, msgData) {
  console.log('Received a new message:', msgData);

  const { sender_id, chat_id, message } = msgData;

  if (!sender_id || !chat_id || !message) {
    console.error('Invalid message data:', msgData);
    sendError(ws, 'Invalid message data');
    return;
  }

  // Find the chat
  let chat = await Chat.findById(chat_id);
  if (!chat) {
    console.error('No such chat:', chat_id);
    sendError(ws, 'Chat does not exist');
    return;
  }

  // Find the recipient's ID
  let userId = chat.participants.find(participant => participant !== sender_id);
  userId = userId ? userId : sender_id;

  // Create a new message ID with timestamp and random string
  const currentTime = new Date();
  const timeHash = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 6);
  const msgId = `${timeHash}-${randomStr}`;

  // Create a new message
  const newMessage = new Message({
    _id: msgId,
    senderId: sender_id,
    chatId: chat_id,
    message: message,
    status: 'sent',
    timestamp: currentTime,
  })

  // Response data for client to display the message
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

  // Broadcast message to the chat room participants except the sender
  const room = chatRooms.get(chat_id) || [];
  room.forEach((clientWs) => {
    if (clientWs !== ws && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(resData));
      console.log('sent new message at:', currentTime);
    }
  });

  newMessage.status = 'delivered';
  const sender = await User.findById(sender_id);
  const recipient = await User.findById(userId);

  const updateData = chat.lastMessage === '' ? {
    event: 'addChat',
    chat_id: chat._id,
    sender_id: sender_id,
    sender_nickname: sender.nickname,
    sender_avatar_url: sender.avatarUrl,
    recipients_id: userId,
    recipients_nickname: recipient.nickname,
    recipients_avatar_url: recipient.avatarUrl,
    content: message,
    timestamp: currentTime,
  } : {
    event: 'updateList',
    recipients_id: userId,
    chat_id: chat._id,
    content: message,
    timestamp: currentTime,
  };

  // Send update message in the common socket room for chat list updates
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(updateData));
      console.log('sent update message: ', updateData);
    }
  });

  // Update last message and its time for chat
  chat.lastMessageTimestamp = currentTime;
  chat.lastMessage = message;
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

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));