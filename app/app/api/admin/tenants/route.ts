
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

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            console.log('❌ No session or not super-admin');
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

        // Obtener estados de WAHA para todos los tenants en una sola llamada (optimización)
        let wahaSessions: any[] = [];
        try {
            const wahaBaseUrl = process.env.WAHA_BASE_URL || 'https://waha.qhosting.net';
            const wahaApiKey = process.env.WAHA_API_KEY;
            
            const response = await fetch(`${wahaBaseUrl}/api/sessions?all=true`, {
                headers: wahaApiKey ? { 'X-Api-Key': wahaApiKey } : {}
            });
            
            if (response.ok) {
                wahaSessions = await response.json();
            }
        } catch (e) {
            console.error('⚠️ No se pudo conectar con WAHA para obtener estados:', (e as any).message);
        }

        // Mapear info de WAHA a los tenants
        const tenantsWithWaha = tenants.map(tenant => {
            const wahaSession = wahaSessions.find((s: any) => s.name === tenant.slug);
            return {
                ...tenant,
                whatsappStatus: wahaSession ? (wahaSession.status === 'WORKING' ? 'ACTIVE' : wahaSession.status) : 'DISCONNECTED',
                whatsappPhone: wahaSession?.me?.id ? wahaSession.me.id.split('@')[0] : null,
                whatsappName: wahaSession?.me?.pushName || null
            };
        });

        console.log(`✅ Found ${tenants.length} tenants with WAHA status`);
        return NextResponse.json(tenantsWithWaha);
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

        // Auto-create starter plan if it doesn't exist
        if (!plan && planName === 'starter') {
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
        }

        if (!plan) {
            return NextResponse.json({ error: `Plan no encontrado: ${planName}` }, { status: 400 });
        }

        // Create tenant and subscription in transaction
        const tenant = await prisma.$transaction(async (tx) => {
            const newTenant = await tx.tenant.create({
                data: {
                    name,
                    slug,
                    domain: domain || null,
                    status: status || 'ACTIVE',
                    isDemo: body.isDemo || false,
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

            return newTenant;
        });

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: 'Error al crear organización' }, { status: 500 });
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

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (domain !== undefined) updateData.domain = domain || null;
        if (status !== undefined) updateData.status = status;
        if (logo !== undefined) updateData.logo = logo || null;
        if (primaryColor !== undefined) updateData.primaryColor = primaryColor || null;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (body.isDemo !== undefined) updateData.isDemo = body.isDemo;

        const updated = await prisma.tenant.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ error: 'Error al actualizar organización' }, { status: 500 });
    }
}
