
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

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            displayName,
            description,
            priceMonthly,
            priceYearly,
            limits,
            features,
            isActive = true,
            isPopular = false,
            sortOrder = 0,
            trialDays = 14
        } = body;

        // Validations
        if (!name || !displayName || !priceMonthly) {
            return NextResponse.json(
                { error: 'Nombre, nombre de visualización y precio mensual son requeridos' },
                { status: 400 }
            );
        }

        // Check if plan name already exists
        const existing = await prisma.plan.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Ya existe un plan con ese nombre' },
                { status: 409 }
            );
        }

        // Create plan
        const newPlan = await prisma.plan.create({
            data: {
                name,
                displayName,
                description: description || null,
                priceMonthly,
                priceYearly: priceYearly || null,
                limits: typeof limits === 'object' ? JSON.stringify(limits) : limits,
                features: typeof features === 'object' ? JSON.stringify(features) : features,
                isActive,
                isPopular,
                sortOrder,
                trialDays
            }
        });

        console.log(`✅ Nuevo plan creado: ${newPlan.displayName} (${newPlan.name})`);

        return NextResponse.json(newPlan, { status: 201 });
    } catch (error) {
        console.error('Error creating plan:', error);
        return NextResponse.json(
            { error: 'Error al crear plan' },
            { status: 500 }
        );
    }
}
