
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UsageTracker } from '@/lib/billing/usage-tracker';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para obtener estadísticas globales del SaaS (Solo Super Admin)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Solo permitir a SUPER_ADMIN
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const [
            globalUsage,
            activeSubscriptions,
            recentActivity
        ] = await Promise.all([
            UsageTracker.getGlobalStats(),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            // Actividad reciente genuina
            prisma.tenant.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    subscription: {
                        include: { plan: true }
                    }
                }
            })
        ]);

        // Calcular MRR real uniendo con planes
        const activeSubsWithPlans = await prisma.subscription.findMany({
            where: { status: 'ACTIVE' },
            include: { plan: true }
        });

        const totalMRR = activeSubsWithPlans.reduce((sum, sub) => sum + Number(sub.plan.priceMonthly), 0);

        return NextResponse.json({
            ...globalUsage,
            activeTenants: activeSubscriptions,
            totalMRR,
            recentActivity: recentActivity.map(t => ({
                type: 'signup',
                tenant: t.name,
                date: t.createdAt,
                plan: t.subscription?.plan.displayName || 'Ninguno'
            }))
        });

    } catch (error) {
        console.error('Error fetching global SaaS stats:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas globales' },
            { status: 500 }
        );
    }
}
