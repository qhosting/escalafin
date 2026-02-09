/**
 * Servicio de Tracking de Uso por Tenant
 * Rastrea el uso de recursos para verificación de límites y facturación
 */

import { prisma } from '@/lib/prisma';
import { redisCache } from '@/lib/redis-cache';
import type { TenantUsage } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export type UsageMetric =
    | 'usersCount'
    | 'loansCount'
    | 'clientsCount'
    | 'storageBytes'
    | 'apiCalls'
    | 'smsCount'
    | 'whatsappCount'
    | 'reportsCount';

export interface UsageSnapshot {
    period: string;
    usersCount: number;
    loansCount: number;
    clientsCount: number;
    storageBytes: bigint;
    apiCalls: number;
    smsCount: number;
    whatsappCount: number;
    reportsCount: number;
}

export interface UsageIncrement {
    metric: UsageMetric;
    value: number;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtiene el periodo actual en formato YYYY-MM
 */
export function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Cache key para uso de tenant
 */
function getUsageCacheKey(tenantId: string, period: string): string {
    return `tenant:${tenantId}:usage:${period}`;
}

// ============================================
// SERVICIO DE TRACKING DE USO
// ============================================

export class UsageTracker {

    /**
     * Obtiene o crea el registro de uso para el periodo actual
     */
    static async getOrCreateUsage(tenantId: string, period?: string): Promise<TenantUsage> {
        const currentPeriod = period || getCurrentPeriod();

        // Intentar desde cache
        const cacheKey = getUsageCacheKey(tenantId, currentPeriod);
        const cached = await redisCache.get<TenantUsage>(cacheKey);
        if (cached) {
            return cached;
        }

        // Buscar o crear en DB
        let usage = await prisma.tenantUsage.findUnique({
            where: {
                tenantId_period: {
                    tenantId,
                    period: currentPeriod
                }
            }
        });

        if (!usage) {
            // Calcular uso actual desde la DB
            const snapshot = await this.calculateCurrentUsage(tenantId);

            usage = await prisma.tenantUsage.create({
                data: {
                    tenantId,
                    period: currentPeriod,
                    ...snapshot
                }
            });
        }

        // Guardar en cache por 5 minutos
        await redisCache.set(cacheKey, usage, 300);

        return usage;
    }

    /**
     * Calcula el uso actual desde la base de datos
     */
    static async calculateCurrentUsage(tenantId: string): Promise<Omit<UsageSnapshot, 'period'>> {
        const [users, loans, clients] = await Promise.all([
            prisma.user.count({ where: { tenantId } }),
            prisma.loan.count({ where: { tenantId } }),
            prisma.client.count({ where: { tenantId } })
        ]);

        // Storage se calcula de archivos
        const files = await prisma.file.aggregate({
            where: {
                uploadedBy: { tenantId }
            },
            _sum: { fileSize: true }
        });

        return {
            usersCount: users,
            loansCount: loans,
            clientsCount: clients,
            storageBytes: BigInt(files._sum.fileSize || 0),
            apiCalls: 0, // Se incrementa con cada llamada
            smsCount: 0,
            whatsappCount: 0,
            reportsCount: 0
        };
    }

    /**
     * Incrementa una métrica de uso
     */
    static async incrementUsage(
        tenantId: string,
        metric: UsageMetric,
        value: number = 1
    ): Promise<void> {
        const period = getCurrentPeriod();

        // Asegurar que existe el registro
        await this.getOrCreateUsage(tenantId, period);

        // Incrementar en DB
        await prisma.tenantUsage.update({
            where: {
                tenantId_period: { tenantId, period }
            },
            data: {
                [metric]: { increment: value }
            }
        });

        // Invalidar cache
        await redisCache.delete(getUsageCacheKey(tenantId, period));
    }

    /**
     * Decrementa una métrica de uso
     */
    static async decrementUsage(
        tenantId: string,
        metric: UsageMetric,
        value: number = 1
    ): Promise<void> {
        const period = getCurrentPeriod();

        await prisma.tenantUsage.update({
            where: {
                tenantId_period: { tenantId, period }
            },
            data: {
                [metric]: { decrement: value }
            }
        });

        // Invalidar cache
        await redisCache.delete(getUsageCacheKey(tenantId, period));
    }

    /**
     * Obtiene el histórico de uso de un tenant
     */
    static async getUsageHistory(tenantId: string, months: number = 12): Promise<TenantUsage[]> {
        return prisma.tenantUsage.findMany({
            where: { tenantId },
            orderBy: { period: 'desc' },
            take: months
        });
    }

    /**
     * Obtiene el uso de un periodo específico
     */
    static async getUsageForPeriod(tenantId: string, period: string): Promise<TenantUsage | null> {
        return prisma.tenantUsage.findUnique({
            where: {
                tenantId_period: { tenantId, period }
            }
        });
    }

    /**
     * Recalcula el uso actual (para correcciones)
     */
    static async recalculateUsage(tenantId: string): Promise<TenantUsage> {
        const period = getCurrentPeriod();
        const snapshot = await this.calculateCurrentUsage(tenantId);

        const usage = await prisma.tenantUsage.upsert({
            where: {
                tenantId_period: { tenantId, period }
            },
            update: {
                usersCount: snapshot.usersCount,
                loansCount: snapshot.loansCount,
                clientsCount: snapshot.clientsCount,
                storageBytes: snapshot.storageBytes
                // No resetear apiCalls, sms, whatsapp ya que son acumulativos
            },
            create: {
                tenantId,
                period,
                ...snapshot
            }
        });

        // Invalidar cache
        await redisCache.delete(getUsageCacheKey(tenantId, period));

        return usage;
    }

    /**
     * Obtiene estadísticas agregadas de todos los tenants (para Super Admin)
     */
    static async getGlobalStats(): Promise<{
        totalTenants: number;
        totalUsers: number;
        totalLoans: number;
        totalClients: number;
        byPeriod: { period: string; totals: Partial<UsageSnapshot> }[];
    }> {
        const [totalTenants, totalUsers, totalLoans, totalClients] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.loan.count(),
            prisma.client.count()
        ]);

        // Últimos 6 meses agregados
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startPeriod = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

        const byPeriod = await prisma.tenantUsage.groupBy({
            by: ['period'],
            where: {
                period: { gte: startPeriod }
            },
            _sum: {
                usersCount: true,
                loansCount: true,
                clientsCount: true,
                apiCalls: true,
                smsCount: true,
                whatsappCount: true
            },
            orderBy: { period: 'asc' }
        });

        return {
            totalTenants,
            totalUsers,
            totalLoans,
            totalClients,
            byPeriod: byPeriod.map(p => ({
                period: p.period,
                totals: {
                    usersCount: p._sum.usersCount || 0,
                    loansCount: p._sum.loansCount || 0,
                    clientsCount: p._sum.clientsCount || 0,
                    apiCalls: p._sum.apiCalls || 0,
                    smsCount: p._sum.smsCount || 0,
                    whatsappCount: p._sum.whatsappCount || 0
                }
            }))
        };
    }

    /**
     * Registra una llamada a la API
     */
    static async trackApiCall(tenantId: string): Promise<void> {
        // Usar Redis para rate limiting en tiempo real, no DB
        const key = `api:calls:${tenantId}:${Math.floor(Date.now() / 60000)}`; // Por minuto

        try {
            await redisCache.increment(key);
            await redisCache.expire(key, 120); // 2 minutos de TTL
        } catch (error) {
            console.error('Error tracking API call:', error);
        }

        // Incrementar en DB de forma asíncrona (no bloquear la request)
        this.incrementUsage(tenantId, 'apiCalls').catch(console.error);
    }

    /**
     * Obtiene llamadas API en el último minuto (para rate limiting)
     */
    static async getApiCallsInLastMinute(tenantId: string): Promise<number> {
        const key = `api:calls:${tenantId}:${Math.floor(Date.now() / 60000)}`;
        const count = await redisCache.get<number>(key);
        return count || 0;
    }
}

export default UsageTracker;
