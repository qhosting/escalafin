import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { UsageTracker } from '@/lib/billing/usage-tracker';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { healthCheck } from '@/lib/health-check';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para obtener estadísticas globales del SaaS (Solo Super Admin)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Solo permitir a SUPER_ADMIN
        if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const [
            globalUsage,
            activeSubscriptions,
            recentActivity,
            healthStatus,
            dbStats
        ] = await Promise.all([
            UsageTracker.getGlobalStats(),
            prisma.subscription.count({ 
                where: { 
                    status: 'ACTIVE',
                    tenant: { isDemo: false }
                } 
            }),
            prisma.tenant.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    subscription: {
                        include: { plan: true }
                    }
                }
            }),
            healthCheck.check(),
            // RAW query to get DB size (PostgreSQL)
            prisma.$queryRaw<{ size: string, bytes: bigint }[]>`
                SELECT pg_size_pretty(pg_database_size(current_database())) as size, 
                       pg_database_size(current_database()) as bytes`
        ]);

        // Calcular MRR real uniendo con planes, excluyendo demos
        const activeSubsWithPlans = await prisma.subscription.findMany({
            where: { 
                status: 'ACTIVE',
                tenant: { isDemo: false }
            },
            include: { plan: true }
        });

        const totalMRR = activeSubsWithPlans.reduce((sum, sub) => sum + Number(sub.plan.priceMonthly), 0);

        // Desglose por plan
        // Calcular tendencias (vs mes anterior)
        const currentPeriodData = globalUsage.byPeriod[globalUsage.byPeriod.length - 1];
        const prevPeriodData = globalUsage.byPeriod[globalUsage.byPeriod.length - 2];

        const calculateTrend = (curr: number, prev: number) => {
            if (!prev) return "+0%";
            const diff = ((curr - prev) / prev) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(1) + "%";
        };

        const trends = {
            tenants: calculateTrend(activeSubscriptions, activeSubscriptions), // Simplified
            users: calculateTrend(currentPeriodData?.totals.usersCount || 0, prevPeriodData?.totals.usersCount || 0),
            loans: calculateTrend(currentPeriodData?.totals.loansCount || 0, prevPeriodData?.totals.loansCount || 0),
            clients: calculateTrend(currentPeriodData?.totals.clientsCount || 0, prevPeriodData?.totals.clientsCount || 0),
            mrr: "+0%" // MRR history not tracked yet
        };

        return NextResponse.json({
            ...globalUsage,
            activeTenants: activeSubscriptions,
            totalMRR,
            plansBreakdown,
            trends,
            chartData: globalUsage.byPeriod.map(p => ({
                month: p.period,
                mrr: totalMRR, // Simplified history for now, but real current total
                tenants: activeSubscriptions, 
                ...p.totals
            })),
            recentActivity: recentActivity.map(t => ({
                id: t.id,
                type: 'signup',
                tenant: t.name,
                date: t.createdAt,
                plan: t.subscription?.plan.displayName || 'Ninguno'
            })),
            infrastructure: {
                dbSize: dbStats[0]?.size || 'N/A',
                dbBytes: Number(dbStats[0]?.bytes || 0),
                dbLatency: healthStatus.checks.database.responseTime,
                redisLatency: healthStatus.checks.redis.responseTime,
                memoryUsage: healthStatus.checks.memory.details,
                uptime: healthStatus.uptime
            }
        });

    } catch (error) {
        console.error('Error fetching global SaaS stats:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas globales' },
            { status: 500 }
        );
    }
}
