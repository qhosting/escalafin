
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true, clients: true }
                },
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug, domain, status } = body;

        // Validaciones básicas
        if (!name || !slug) {
            return NextResponse.json({ error: 'Nombre y Slug requeridos' }, { status: 400 });
        }

        // Verificar slug único
        const existing = await prisma.tenant.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug ya existe' }, { status: 409 });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug,
                domain: domain || null,
                status: status || 'ACTIVE'
            }
        });

        // Audit Log
        await AuditLogger.quickLog(
            request,
            'SYSTEM_CONFIG_UPDATE', // Reusing or should I use a new one? Let's check AuditAction
            { name, slug, domain, status },
            'TENANT',
            tenant.id,
            session
        );

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: 'Error creando tenant' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, slug, domain, status, logo, primaryColor, timezone } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID de tenant requerido' }, { status: 400 });
        }

        // Si slug está presente, verificar que sea único (descontando el actual)
        if (slug) {
            const existing = await prisma.tenant.findUnique({
                where: { slug }
            });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 });
            }
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                slug,
                domain: domain === "" ? null : domain,
                status,
                logo,
                primaryColor,
                timezone
            }
        });

        // Audit Log
        await AuditLogger.quickLog(
            request,
            'SYSTEM_CONFIG_UPDATE',
            { name, slug, domain, status, logo, primaryColor, timezone },
            'TENANT',
            id,
            session
        );

        return NextResponse.json(updatedTenant);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ error: 'Error actualizando tenant' }, { status: 500 });
    }
}
