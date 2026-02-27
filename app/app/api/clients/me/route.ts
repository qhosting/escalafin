export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

/**
 * GET /api/clients/me
 * Retorna el perfil del cliente asociado al usuario logueado (rol CLIENTE).
 * También utilizado por el dashboard de cliente.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
        }

        const tenantPrisma = getTenantPrisma(tenantId);

        // Buscar el perfil de cliente vinculado a este usuario
        const client = await tenantPrisma.client.findFirst({
            where: { userId: session.user.id },
            include: {
                loans: {
                    where: { status: { in: ['ACTIVE', 'DEFAULTED'] } },
                    select: {
                        id: true,
                        loanNumber: true,
                        principalAmount: true,
                        balanceRemaining: true,
                        monthlyPayment: true,
                        status: true,
                        paymentFrequency: true,
                        startDate: true,
                        endDate: true,
                    }
                },
                personalReferences: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        fullName: true,
                        relationship: true,
                        phone: true,
                    }
                }
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Perfil de cliente no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ client });

    } catch (error) {
        console.error('Error fetching client profile:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
