
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: Manage Plans
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const plans = await prisma.plan.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return NextResponse.json(
            { error: 'Error al obtener planes' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { id, priceMonthly, priceYearly, isActive, isPopular, displayName, description, limits, features } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        const updated = await prisma.plan.update({
            where: { id },
            data: {
                priceMonthly,
                priceYearly,
                isActive,
                isPopular,
                displayName,
                description,
                limits: typeof limits === 'object' ? JSON.stringify(limits) : limits,
                features: typeof features === 'object' ? JSON.stringify(features) : features,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating plan:', error);
        return NextResponse.json(
            { error: 'Error al actualizar plan' },
            { status: 500 }
        );
    }
}
