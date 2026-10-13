const request = require('supertest');
const express = require('express');
const taskController = require('../controllers/taskController');

// Database Mock
const Task = require('../models/taskModel');
const Team = require('../models/teamModel');
const Account = require('../models/accountModel');

jest.mock('../models/taskModel');
jest.mock('../models/teamModel');
jest.mock('../models/accountModel');
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

// Helper Service Mock
const { transactionRunService } = require('../services/transactionRunService');
const { createOrUpdateEmitDashboard } = require('../services/dashboardService');
const { createActivityForUsers } = require('../services/activityService');
const { getJson, setJson, invalidateUserCaches, deleteKeys } = require('../services/cacheService');


const app = express();
app.use(express.json());

// Middleware auth mock
app.use((req, res, next) => {
  req.user = { id: '65f123456789012345678901' }; // Mock Mongoose ObjectId
  next();
});

// Routes
app.post('/api/task/create', taskController.createTask);

describe('Task Controller API Endpoints', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Create task test
  describe('POST /api/task/create', () => {
    
    it('should return 400 if title or status is missing', async () => {
      const res = await request(app)
        .post('/api/task/create')
        .send({ title: 'Task without status' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Title and status should not be empty');
    });
  });
})