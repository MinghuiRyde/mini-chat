const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { login } = require('../controllers/AuthController');

jest.mock('../utils/wechatAuth', () => ({
  getSessionKeyAndOpenId: jest.fn(),
}));

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
  let jwtSignSpy, jwtDecodeSpy;

  beforeEach(async () => {
    jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('testSessionToken');
    jwtDecodeSpy = jest.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 })
  })

  afterEach(async () => {
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    jest.restoreAllMocks();
  });

  it('should return 400 if authentication code is missing', async () => {
    const res = await request(app).post('/login').send({
      nickname: 'John Doe',
      avatar_url: 'url',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing jsCode in request body');
  });

  it('should return 400 if nickname or avatar is missing', async () => {
    const res = await request(app).post('/login').send({
      auth_code: 'code',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Missing nickname or avatarUrl');
  });

  it('should return session_token and its details', async () => {
    getSessionKeyAndOpenId.mockResolvedValue({ openId: 'testId' });

    const res = await request(app).post('/login').send({
      auth_code: 'code',
      nickname: 'John Doe',
      avatar_url: 'url',
    });

    expect(res.status).toBe(200);
    expect(res.body.session_token).toBe('testSessionToken');
    expect(res.body.user_id).toBe('d7rLUbQ');

    const user = await User.findById(res.body.user_id);
    expect(user).not.toBeNull();
    expect(user.nickname).toBe('John Doe');
  });

  it('should return 500 if getSessionKeyAndOpenId throws an error', async () => {
    getSessionKeyAndOpenId.mockRejectedValue(new Error('Wechat Authentication Error'));

    const res = await request(app).post('/login').send({
      auth_code: 'code',
      nickname: 'John Doe',
      avatar_url: 'url',
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Wechat Authentication Error');
  });
});