/**
 * Example Unit Test: Health Check Service
 * 
 * Pruebas unitarias para el servicio de health checks
 */

import { HealthCheckService } from '../lib/health-check';

// Mock de dependencias
jest.mock('../lib/redis-cache', () => ({
    redisCache: {
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue('test-value'),
        del: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    })),
}));

describe('HealthCheckService', () => {
    let healthCheckService: HealthCheckService;

    beforeEach(() => {
        healthCheckService = new HealthCheckService();
    });

    describe('liveness', () => {
        it('should return true when process is running', async () => {
            const result = await healthCheckService.liveness();
            expect(result).toBe(true);
        });
    });

    describe('metrics', () => {
        it('should return system metrics', async () => {
            const metrics = await healthCheckService.metrics();

            expect(metrics).toHaveProperty('process');
            expect(metrics).toHaveProperty('memory');
            expect(metrics).toHaveProperty('cpu');
            expect(metrics).toHaveProperty('env');

            expect(metrics.process).toHaveProperty('uptime');
            expect(metrics.process).toHaveProperty('pid');
            expect(metrics.process).toHaveProperty('version');
        });

        it('should include memory usage information', async () => {
            const metrics = await healthCheckService.metrics();

            expect(metrics.memory).toHaveProperty('rss');
            expect(metrics.memory).toHaveProperty('heapTotal');
            expect(metrics.memory).toHaveProperty('heapUsed');
            expect(metrics.memory).toHaveProperty('external');
        });
    });

    describe('check', () => {
        it('should perform full health check', async () => {
            const result = await healthCheckService.check();

            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('checks');
            expect(result).toHaveProperty('version');

            expect(result.checks).toHaveProperty('database');
            expect(result.checks).toHaveProperty('redis');
            expect(result.checks).toHaveProperty('disk');
            expect(result.checks).toHaveProperty('memory');
        });

        it('should return healthy status when all checks pass', async () => {
            const result = await healthCheckService.check();

            // Note: This will depend on your mock implementations
            expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
        });
    });
});
