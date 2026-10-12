const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Account = require('../models/accountModel');

// Mock Test
jest.mock('../models/accountModel');
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  })
}));
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({ text: 'mock response' }),
    },
  })),
}));

describe('Account API Endpoints (/api/account)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testing account create endpoint
  describe('POST /api/account/create', () => {
    it('should register a new account and return 201', async () => {
      Account.findOne.mockResolvedValue(null);
      Account.create.mockResolvedValue({
        _id: 'mockUserId123',
        username: 'eneil',
        email: 'eneil@example.com'
      });

      const res = await request(app)
        .post('/api/account/create')
        .send({
          username: 'eneil',
          email: 'eneil@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id', 'mockUserId123');
      expect(res.body.message).toContain('Registration Succesful');
      expect(Account.findOne).toHaveBeenCalledWith({ email: 'eneil@example.com' });
    });

    it('should return 400 if email already exists', async () => {
      Account.findOne.mockResolvedValue({ _id: 'existingUser' });

      const res = await request(app)
        .post('/api/account/create')
        .send({
          username: 'eneil',
          email: 'eneil@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('User already exist!');
    });
  });

  describe('POST /api/account/login', () => {
    // Succesful Login
    it('should login successfully and set a cookie for valid credentials', async () => {
      const mockUser = {
        _id: 'mockUserId123',
        username: 'eneil',
        email: 'eneil@example.com',
        isVerified: true,
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      Account.findOne.mockResolvedValue(mockUser);

      // Send Request
      const res = await request(app)
        .post('/api/account/login')
        .send({
          email: 'eneil@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', 'mockUserId123');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(Account.findOne).toHaveBeenCalledWith({ email: 'eneil@example.com' });
    })

    // 401
    it('should return 401 for invalid password', async () => {
      const mockUser = {
        email: 'eneil@example.com',
        matchPassword: jest.fn().mockResolvedValue(false)
      };
      Account.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/account/login')
        .send({
          email: 'eneil@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid email or password');
    });
  })

  // 403
  it('should return 403 if account is not verified', async () => {
      const mockUser = {
        _id: 'mockUserId123',
        username: 'eneil',
        email: 'eneil@example.com',
        isVerified: false,
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      Account.findOne.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/account/login')
        .send({
          email: 'eneil@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Email is not verified yet');
    });


  // TODO: Do more testing
});