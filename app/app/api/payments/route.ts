export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

/**
 * GET /api/payments
 * Retorna los pagos del tenant filtrados por rol:
 *  - ADMIN/SUPER_ADMIN: todos los pagos del tenant
 *  - ASESOR: pagos de préstamos de cualquier cliente del tenant
 *  - CLIENTE: solo los pagos de sus préstamos
 */
export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const skip = (page - 1) * limit;

        let whereClause: any = { tenantId };

        if (session.user.role === 'CLIENTE') {
            // Solo pagos del cliente logueado
            const clientProfile = await tenantPrisma.client.findFirst({
                where: { userId: session.user.id }
            });
            if (!clientProfile) {
                return NextResponse.json({ payments: [], total: 0 });
            }
            whereClause = {
                loan: { clientId: clientProfile.id, tenantId }
            };
        }
        // ADMIN, SUPER_ADMIN, ASESOR: todos los pagos del tenant

        const [payments, total] = await Promise.all([
            tenantPrisma.payment.findMany({
                where: whereClause,
                orderBy: { paymentDate: 'desc' },
                take: limit,
                skip,
                include: {
                    loan: {
                        select: {
                            loanNumber: true,
                            principalAmount: true,
                            balanceRemaining: true,
                            status: true,
                            client: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                }
                            }
                        }
                    }
                }
            }),
            tenantPrisma.payment.count({ where: whereClause })
        ]);

        // Calcular stats rápidas
        const stats = await tenantPrisma.payment.groupBy({
            where: whereClause,
            by: ['status'],
            _count: { status: true },
            _sum: { amount: true }
        } as any);

        const statsMap = (stats as any[]).reduce((acc: any, s: any) => {
            acc[s.status] = { count: s._count.status, amount: Number(s._sum.amount || 0) };
            return acc;
        }, {});

        return NextResponse.json({
            payments,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats: {
                totalPayments: total,
                completedPayments: statsMap['COMPLETED']?.count || 0,
                pendingPayments: statsMap['PENDING']?.count || 0,
                totalAmount: Object.values(statsMap).reduce((sum: any, s: any) => sum + s.amount, 0)
            }
        });

    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
