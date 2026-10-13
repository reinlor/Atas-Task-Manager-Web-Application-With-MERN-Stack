const cacheService = require('../../services/cacheService');
const redisClient = require('../../config/redis');

jest.mock('../../config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scanIterator: jest.fn()
}));

describe('Cache Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test to return json when key exist or no
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

    // Test to check if json is being stored on the mock redis cache 
    describe('setJson', () => {
        it('should serialize and set JSON string in Redis with default TTL', async () => {
            const mockData = { title: 'Task' };

            await cacheService.setJson('taskKey', mockData);

            expect(redisClient.set).toHaveBeenCalledWith('taskKey', JSON.stringify(mockData), { EX: 60 });
        });
    });

    // Test for Key Deleting
    describe('deleteKeys', () => {
        it('should delete valid string keys', async () => {
            redisClient.del.mockResolvedValue(2);

            const result = await cacheService.deleteKeys('key1', 'key2');

            expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
            expect(result).toBe(2);
        });

        it('should return 0 immediately without calling Redis if no valid keys given', async () => {
            const result = await cacheService.deleteKeys('', null, undefined);

            expect(redisClient.del).not.toHaveBeenCalled();
            expect(result).toBe(0);
        });
    });

    describe('deleteByPattern', () => {
        it('should iterate matching keys and delete them', async () => {
            redisClient.scanIterator.mockImplementation(async function* () {
                yield 'tasks:123:pending:latest';
                yield 'tasks:123:complete:oldest';
            });
            redisClient.del.mockResolvedValue(1);

            await cacheService.deleteByPattern('tasks:123:*');

            expect(redisClient.scanIterator).toHaveBeenCalledWith({ MATCH: 'tasks:123:*', COUNT: 100 });
            expect(redisClient.del).toHaveBeenCalledTimes(2);
        });
    });

    describe('invalidateUserCaches', () => {
        it('should delete exact user cache keys and matching task list keys', async () => {
            redisClient.scanIterator.mockImplementation(async function* () {
                yield 'tasks:user123:all';
            });
            redisClient.del.mockResolvedValue(1);

            await cacheService.invalidateUserCaches('user123');

            expect(redisClient.del).toHaveBeenCalledWith([
                'dashboard:user123',
                'activity:user123',
                'notifications:user123',
                'boards:user123'
            ]);
        });
    });
});