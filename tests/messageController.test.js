const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const messageController = require('../controllers/messageController');

let app, mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri)
    .then(async () => { console.log('Connected to MongoDB'); })
    .catch((err) => { console.error(err); });

  app = express();
  app.use(express.json());
  
  app.get('/messages', messageController.getMessagesByChatId);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('GET /messages', () => {
  let chat, sender, receiver, msg1, msg2;

  beforeEach(async () => {
    sender = await User.create({ _id: 'UserA', sessionToken: 'Token 1', nickname: 'Ace', avatarUrl: 'ace.png' });
    receiver = await User.create({ _id: 'UserB', sessionToken: 'Token 2', nickname: 'Bob', avatarUrl: 'bob.png' });

    chat = await Chat.create({
      _id: 'chat0',
      lastMessage: 'sup',
      lastMessageTimestamp: new Date(),
      participants: ['UserA', 'UserB'],
      unreadCount: {
        'UserA': 0,
        'UserB': 0,
      }
    });

    msg1 = await Message.create({
      _id: 'message1',
      senderId: sender._id,
      chatId: chat._id,
      message: 'hello world',
      status: 'read',
      timestamp: new Date(Date.now() - 10000),
    });

    msg2 = await Message.create({
      _id: 'message2',
      senderId: receiver._id,
      chatId: chat._id,
      message: 'sup',
      status: 'sent',
      timestamp: new Date(),
    });
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});
  });

  it('should return messages for a valid chatId', async () => {
    const res = await request(app).get(`/messages?chat_id=${chat._id}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(2);
    expect(res.body.messages[0].content).toBe('sup');
  });

  it('should return 400 for missing chatId', async () => {
    const res = await request(app).get('/messages');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing chat_id');
  });

  it('should return 404 for non-existing chatId', async () => {
    const fakeId = 'fakeee';
    const res = await request(app).get(`/messages?chat_id=${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Chat Not Found');
  });

  it('should handle pagination correctly', async () => {
    const res = await request(app).get(`/messages?chat_id=${chat._id}&limit=1&offset=0`);
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(1);
  });

});