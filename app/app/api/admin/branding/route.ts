
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const tenantId = session?.user?.tenantId;

        if (!session?.user?.id || session.user.role !== 'ADMIN' || !tenantId) {
            return NextResponse.json({ error: 'No autorizado o sin tenant' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                logo: true,
                primaryColor: true,
                name: true,
                slug: true
            }
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error fetching branding:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        const tenantId = session?.user?.tenantId;

        if (!session?.user?.id || session.user.role !== 'ADMIN' || !tenantId) {
            return NextResponse.json({ error: 'No autorizado o sin tenant' }, { status: 401 });
        }

        const body = await request.json();
        const { logo, primaryColor } = body;

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                logo,
                primaryColor
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating branding:', error);
        return NextResponse.json({ error: 'Error al actualizar branding' }, { status: 500 });
    }
}
