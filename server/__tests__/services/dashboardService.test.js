const dashboardService = require('../../services/dashboardService');
const dashboard = require('../../models/dashboardModel');
const { invalidateUserCaches } = require('../../services/cacheService');

// Redis Mock
jest.mock('../../config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scanIterator: jest.fn()
}));

jest.mock('../../models/dashboardModel');
jest.mock('../../services/cacheService');

describe('Dashboard Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrUpdateEmitDashboard', () => {
        it('should update stats pipeline and invalidate user cache', async () => {
            const mockUpdatedDashboard = { userId: 'user123', stats: { inProgress: 1, completed: 0, shared: 0, totalTask: 1 } };
            dashboard.findOneAndUpdate.mockResolvedValue(mockUpdatedDashboard);

            const result = await dashboardService.createOrUpdateEmitDashboard({
                userId: 'user123',
                stats: { inProgress: 1 }
            });

            expect(dashboard.findOneAndUpdate).toHaveBeenCalledWith(
                { userId: 'user123' },
                expect.any(Array),
                expect.objectContaining({ upsert: true, new: true })
            );
            expect(invalidateUserCaches).toHaveBeenCalledWith('user123');
            expect(result).toEqual(mockUpdatedDashboard);
        });

        it('should perform secondary update to push recent task when title and status are provided', async () => {
            const mockDashStatsUpdated = { userId: 'user123' };
            const mockDashTaskPushed = { userId: 'user123', recentTask: [{ title: 'Task 1', status: 'Pending' }] };

            dashboard.findOneAndUpdate
                .mockResolvedValueOnce(mockDashStatsUpdated)
                .mockResolvedValueOnce(mockDashTaskPushed);

            const result = await dashboardService.createOrUpdateEmitDashboard({
                userId: 'user123',
                stats: { inProgress: 1 },
                recentTask: { title: 'Task 1', status: 'Pending' }
            });

            expect(dashboard.findOneAndUpdate).toHaveBeenCalledTimes(2);
            expect(dashboard.findOneAndUpdate).toHaveBeenNthCalledWith(
                2,
                { userId: 'user123' },
                expect.objectContaining({
                    $push: expect.objectContaining({
                        recentTask: expect.objectContaining({
                            $each: [expect.objectContaining({ title: 'Task 1', status: 'Pending' })],
                            $position: 0,
                            $slice: 10
                        })
                    })
                }),
                expect.objectContaining({ new: true })
            );
            expect(result).toEqual(mockDashTaskPushed);
        });

        it('should throw error if findOneAndUpdate fails', async () => {
            dashboard.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

            await expect(
                dashboardService.createOrUpdateEmitDashboard({ userId: 'user123' })
            ).rejects.toThrow('Database error');
        });
    });
});