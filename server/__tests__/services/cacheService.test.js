const cacheService = require('../services/cacheService');
const redisClient = require('../config/redis');

jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scanIterator: jest.fn()
}));

describe('Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getJson', () => {
    it('should parse and return JSON data when key exists', async () => {
      const mockData = { id: '123', name: 'Test' };
      redisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.getJson('testKey');

      expect(redisClient.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual(mockData);
    });

    it('should return null if key does not exist', async () => {
      redisClient.get.mockResolvedValue(null);

      const result = await cacheService.getJson('missingKey');

      expect(result).toBeNull();
    });
  });

});