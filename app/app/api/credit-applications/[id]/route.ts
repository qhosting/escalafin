export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);
        const id = params.id;

        const application = await tenantPrisma.creditApplication.findUnique({
            where: { id },
            include: {
                client: true,
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                reviewedByUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                loan: {
                    select: {
                        id: true,
                        loanNumber: true,
                        status: true
                    }
                }
            }
        });

        if (!application) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        // Aislamiento: El cliente solo puede ver sus propias solicitudes
        if (session.user.role === 'CLIENTE' && application.clientId !== session.user.id) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        // El asesor solo puede ver solicitudes que él creó (si no es admin)
        if (session.user.role === 'ASESOR' && application.createdById !== session.user.id) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        return NextResponse.json(application);

    } catch (error) {
        console.error('Error fetching credit application:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);
        const id = params.id;

        // Solo ADMIN puede eliminar solicitudes, o el creador si aún está PENDING
        const application = await tenantPrisma.creditApplication.findUnique({
            where: { id }
        });

        if (!application) {
            return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
        }

        if (session.user.role !== 'ADMIN' && application.createdById !== session.user.id) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        if (application.status !== 'PENDING' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No se puede eliminar una solicitud ya procesada' }, { status: 400 });
        }

        await tenantPrisma.creditApplication.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Solicitud eliminada' });

    } catch (error) {
        console.error('Error deleting credit application:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
