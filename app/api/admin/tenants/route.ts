
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: 'Error creando tenant' }, { status: 500 });
    }
}
