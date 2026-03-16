
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: List and manage all tenants
 */
export async function GET(request: NextRequest) {
    try {
        console.log('📌 GET /api/admin/tenants called');
        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('❌ No session found');
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        console.log(`👤 User requesting: ${session.user.email} (${session.user.role})`);

        if (session.user.role !== 'SUPER_ADMIN') {
            console.log('❌ User is not SUPER_ADMIN');
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

        console.log(`✅ Found ${tenants.length} tenants`);
        return NextResponse.json(tenants);
    } catch (error) {
        console.error('❌ Error fetching tenants:', error);
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
        console.log(`🔍 Looking for plan with name: "${planName}"`);
        let plan = await prisma.plan.findUnique({ where: { name: planName } });

        // Auto-create starter plan if it doesn't exist to prevent provisioning breakage
        if (!plan && planName === 'starter') {
            console.log('🌱 Starter plan not found, creating it...');
            try {
                plan = await prisma.plan.create({
                    data: {
                        name: 'starter',
                        displayName: 'Starter',
                        description: 'Plan inicial auto-generado',
                        priceMonthly: 0,
                        currency: 'MXN',
                        features: JSON.stringify(["Gestión de Clientes", "Gestión de Préstamos"]),
                        limits: JSON.stringify({ users: 3, loans: 100, clients: 200 }),
                        isActive: true,
                        trialDays: 14
                    }
                });
            } catch (e) {
                console.error("Error auto-creating starter plan:", e);
            }
        }

        if (!plan) {
            console.error(`❌ Plan "${planName}" not found in database.`);
            // Try to find ANY plan to fallback or help debug
            const existingPlans = await prisma.plan.findMany({ select: { name: true } });
            console.log("Available plans:", existingPlans.map(p => p.name));

            return NextResponse.json({
                error: `Plan no encontrado: "${planName}". Planes disponibles: ${existingPlans.map(p => p.name).join(', ')}`
            }, { status: 400 });
        }

        // Create tenant and subscription in transaction
        const tenant = await prisma.$transaction(async (tx) => {
            const newTenant = await tx.tenant.create({
                data: {
                    name,
                    slug,
                    domain: domain || null, // Convert empty string to null to avoid unique constraint error
                    status: status || 'ACTIVE',
                }
            });

            await tx.subscription.create({
                data: {
                    tenantId: newTenant.id,
                    planId: plan!.id,
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
        const { id, name, slug, domain, status, logo, primaryColor, timezone } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        // Validate slug format (only lowercase letters, numbers, hyphens)
        if (slug && !/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'El slug solo puede contener letras minúsculas, números y guiones' }, { status: 400 });
        }

        // Check slug uniqueness (excluding current tenant)
        if (slug) {
            const slugConflict = await prisma.tenant.findFirst({
                where: { slug, NOT: { id } }
            });
            if (slugConflict) {
                return NextResponse.json({ error: `El slug "${slug}" ya está en uso por otra organización` }, { status: 409 });
            }
        }

        // Check domain uniqueness (excluding current tenant)
        if (domain) {
            const domainConflict = await prisma.tenant.findFirst({
                where: { domain, NOT: { id } }
            });
            if (domainConflict) {
                return NextResponse.json({ error: `El dominio "${domain}" ya está en uso por otra organización` }, { status: 409 });
            }
        }

        // Build data object dynamically to only update provided fields
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (domain !== undefined) updateData.domain = domain || null;
        if (status !== undefined) updateData.status = status;
        if (logo !== undefined) updateData.logo = logo || null;
        if (primaryColor !== undefined) updateData.primaryColor = primaryColor || null;
        if (timezone !== undefined) updateData.timezone = timezone;

        const updated = await prisma.tenant.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating tenant:', error);

        // Prisma unique constraint error
        if (error?.code === 'P2002') {
            const field = error?.meta?.target?.[0];
            const fieldLabel = field === 'slug' ? 'slug' : field === 'domain' ? 'dominio' : field;
            return NextResponse.json(
                { error: `El ${fieldLabel} ya está en uso por otra organización` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Error al actualizar organización' },
            { status: 500 }
        );
    }
}
