export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { ApplicationStatus } from '@prisma/client';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Solo ADMIN puede revisar solicitudes
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Solo administradores pueden revisar solicitudes' }, { status: 403 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);
        const id = params.id;

        const body = await request.json();
        const {
            status,
            reviewComments,
            approvedAmount,
            approvedTerm,
            interestRate
        } = body;

        if (!status || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
            return NextResponse.json({ error: 'Estado de revisión inválido' }, { status: 400 });
        }

        const application = await tenantPrisma.creditApplication.update({
            where: { id },
            data: {
                status: status as ApplicationStatus,
                reviewComments: reviewComments || null,
                approvedAmount: approvedAmount ? parseFloat(approvedAmount) : null,
                approvedTerm: approvedTerm ? parseInt(approvedTerm) : null,
                interestRate: interestRate ? parseFloat(interestRate) : null,
                reviewedById: session.user.id,
                reviewedAt: new Date()
            },
            include: {
                client: true,
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(application);

    } catch (error) {
        console.error('Error reviewing credit application:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
