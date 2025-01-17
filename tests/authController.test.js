const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { login } = require('../controllers/AuthController');
const { getSessionKeyAndOpenId } = require('../utils/wechatAuth');

let app, mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());
  app.post('/login', login);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('POST /login', () => {
  let getSessionKetAndOpenIdStub, jwtSignStub, jwtDecodeStub;

  beforeEach(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    sinon.restore();
  })
})