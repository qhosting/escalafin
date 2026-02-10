
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: Global Subscriptions Overview
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const subscriptions = await prisma.subscription.findMany({
            include: {
                tenant: {
                    select: { name: true, slug: true, status: true, logo: true }
                },
                plan: {
                    select: { name: true, displayName: true, priceMonthly: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const activeSubCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
        const totalMRR = subscriptions.reduce((sum, sub) =>
            sub.status === 'ACTIVE' ? sum + Number(sub.plan.priceMonthly) : sum,
            0
        );

        return NextResponse.json({
            subscriptions,
            activeSubCount,
            totalMRR
        });
    } catch (error) {
        console.error('Error fetching global subscriptions:', error);
        return NextResponse.json(
            { error: 'Error al obtener suscripciones' },
            { status: 500 }
        );
    }
}
