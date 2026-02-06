/**
 * System Health Check Service
 * 
 * Monitoreo del estado del sistema y sus dependencias
 */

import { PrismaClient } from '@prisma/client';
import { redisCache } from './redis-cache';

const prisma = new PrismaClient();

export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database: ServiceCheck;
        redis: ServiceCheck;
        disk: ServiceCheck;
        memory: ServiceCheck;
    };
    version: string;
}

export interface ServiceCheck {
    status: 'up' | 'down' | 'degraded';
    responseTime?: number;
    message?: string;
    details?: any;
}

export class HealthCheckService {
    /**
     * Ejecuta todos los health checks
     */
    async check(): Promise<HealthCheckResult> {
        const startTime = Date.now();

        const [database, redis, disk, memory] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkDisk(),
            this.checkMemory(),
        ]);

        const allUp = [database, redis, disk, memory].every(c => c.status === 'up');
        const anyDown = [database, redis, disk, memory].some(c => c.status === 'down');

        return {
            status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                database,
                redis,
                disk,
                memory,
            },
            version: process.env.APP_VERSION || '1.0.0',
        };
    }

    /**
     * Check PostgreSQL database
     */
    private async checkDatabase(): Promise<ServiceCheck> {
        const startTime = Date.now();

        try {
            await prisma.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - startTime;

            return {
                status: responseTime < 1000 ? 'up' : 'degraded',
                responseTime,
                message: responseTime < 1000 ? 'Connected' : 'Slow response',
            };
        } catch (error) {
            return {
                status: 'down',
                message: 'Database connection failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check Redis cache
     */
    private async checkRedis(): Promise<ServiceCheck> {
        const startTime = Date.now();

        try {
            const testKey = 'health:check';
            const testValue = Date.now().toString();

            await redisCache.set(testKey, testValue, 10);
            const retrieved = await redisCache.get<string>(testKey);
            await redisCache.del(testKey);

            const responseTime = Date.now() - startTime;

            if (retrieved !== testValue) {
                return {
                    status: 'degraded',
                    responseTime,
                    message: 'Redis data integrity issue',
                };
            }

            return {
                status: responseTime < 500 ? 'up' : 'degraded',
                responseTime,
                message: responseTime < 500 ? 'Connected' : 'Slow response',
            };
        } catch (error) {
            return {
                status: 'down',
                message: 'Redis connection failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check disk space
     */
    private async checkDisk(): Promise<ServiceCheck> {
        try {
            const fs = require('fs');
            const path = require('path');

            // Check if we can write to temp directory
            const testFile = path.join(process.cwd(), '.health-check');

            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);

            // En producción, aquí podrías usar un módulo como 'check-disk-space'
            // para obtener métricas reales de disco

            return {
                status: 'up',
                message: 'Disk write successful',
            };
        } catch (error) {
            return {
                status: 'down',
                message: 'Disk check failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Check memory usage
     */
    private async checkMemory(): Promise<ServiceCheck> {
        const usage = process.memoryUsage();
        const totalMB = usage.heapTotal / 1024 / 1024;
        const usedMB = usage.heapUsed / 1024 / 1024;
        const percentUsed = (usedMB / totalMB) * 100;

        return {
            status: percentUsed < 90 ? 'up' : 'degraded',
            message: `${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${percentUsed.toFixed(1)}%)`,
            details: {
                heapUsed: usedMB,
                heapTotal: totalMB,
                percentUsed: percentUsed.toFixed(1),
                rss: (usage.rss / 1024 / 1024).toFixed(2) + 'MB',
            },
        };
    }

    /**
     * Lightweight liveness check (para Kubernetes)
     */
    async liveness(): Promise<boolean> {
        try {
            // Check si el proceso puede responder
            return process.uptime() > 0;
        } catch {
            return false;
        }
    }

    /**
     * Readiness check (para Kubernetes)
     */
    async readiness(): Promise<boolean> {
        try {
            // Check servicios críticos
            const [dbCheck, redisCheck] = await Promise.all([
                this.checkDatabase(),
                this.checkRedis(),
            ]);

            return dbCheck.status !== 'down' && redisCheck.status !== 'down';
        } catch {
            return false;
        }
    }

    /**
     * Métricas del sistema
     */
    async metrics(): Promise<any> {
        const memory = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
            process: {
                uptime: process.uptime(),
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            memory: {
                rss: memory.rss,
                heapTotal: memory.heapTotal,
                heapUsed: memory.heapUsed,
                external: memory.external,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            env: {
                nodeEnv: process.env.NODE_ENV,
                version: process.env.APP_VERSION || '1.0.0',
            },
        };
    }
}

export const healthCheck = new HealthCheckService();
