/**
 * Redis Cache Service
 * 
 * Sistema de cache para queries frecuentes y mejora de rendimiento
 */

import { createClient, RedisClientType } from 'redis';

class RedisCacheService {
    private client: RedisClientType | null = null;
    private isConnected = false;

    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis: Max retries reached');
                            return new Error('Max retries reached');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            this.client.on('connect', () => {
                console.log('✅ Redis connected successfully');
            });

            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
            // Continue without cache if Redis is not available
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) return null;

        try {
            const value = await this.client.get(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
        if (!this.isConnected || !this.client) return false;

        try {
            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        if (!this.isConnected || !this.client) return false;

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
            return false;
        }
    }

    async invalidatePattern(pattern: string): Promise<number> {
        if (!this.isConnected || !this.client) return 0;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) return 0;

            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            console.error(`Redis invalidate pattern error for ${pattern}:`, error);
            return 0;
        }
    }

    async remember<T>(
        key: string,
        ttlSeconds: number,
        callback: () => Promise<T>
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // If not in cache, execute callback
        const result = await callback();

        // Store in cache
        await this.set(key, result, ttlSeconds);

        return result;
    }

    async disconnect(): Promise<void> {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Helper methods for common cache patterns

    /**
     * Cache para listados con paginación
     */
    getCacheKey(resource: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');

        return `${resource}:${sortedParams}`;
    }

    /**
     * Invalidar cache de un recurso específico
     */
    async invalidateResource(resource: string, id?: string): Promise<void> {
        if (id) {
            await this.del(`${resource}:${id}`);
        }
        await this.invalidatePattern(`${resource}:*`);
    }
}

export const redisCache = new RedisCacheService();

// Auto-connect on import
if (process.env.REDIS_URL) {
    redisCache.connect().catch(console.error);
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    SHORT: 60,           // 1 minute
    MEDIUM: 300,         // 5 minutes
    LONG: 900,           // 15 minutes
    HOUR: 3600,          // 1 hour
    DAY: 86400,          // 24 hours
} as const;

// Cache key patterns
export const CACHE_KEYS = {
    LOANS: 'loans',
    CLIENTS: 'clients',
    PAYMENTS: 'payments',
    DASHBOARD: 'dashboard',
    REPORTS: 'reports',
    STATISTICS: 'stats',
} as const;
