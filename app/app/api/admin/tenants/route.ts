
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: List and manage all tenants
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenants = await prisma.tenant.findMany({
            include: {
                subscription: {
                    include: { plan: true }
                },
                _count: {
                    select: {
                        users: true,
                        loans: true,
                        clients: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json(
            { error: 'Error al obtener organizaciones' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Create a new tenant manually
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug, domain, status, planName = 'starter' } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
        }

        // Check if slug exists
        const existing = await prisma.tenant.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 400 });
        }

        // Get plan
        const plan = await prisma.plan.findUnique({ where: { name: planName } });
        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 400 });
        }

        // Create tenant and subscription in transaction
        const tenant = await prisma.$transaction(async (tx) => {
            const newTenant = await tx.tenant.create({
                data: {
                    name,
                    slug,
                    domain,
                    status: status || 'ACTIVE',
                }
            });

            await tx.subscription.create({
                data: {
                    tenantId: newTenant.id,
                    planId: plan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                }
            });

            // Sembrar módulos por defecto o configuración inicial aquí si es necesario

            return newTenant;
        });

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json(
            { error: 'Error al crear organización' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Update tenant status
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'ID y estado son requeridos' }, { status: 400 });
        }

        const updated = await prisma.tenant.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return NextResponse.json(
            { error: 'Error al actualizar organización' },
            { status: 500 }
        );
    }
}
