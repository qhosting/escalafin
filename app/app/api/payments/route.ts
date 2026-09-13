export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { parsePagination } from '@/lib/pagination';
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
        const { page, limit, skip } = parsePagination(searchParams, 50);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const advisorId = searchParams.get('advisorId');
        const search = searchParams.get('search');

        const conditions: any[] = [];

        // Filtro de búsqueda (por cliente o préstamo)
        if (search) {
            conditions.push({
                OR: [
                    { reference: { contains: search, mode: 'insensitive' } },
                    {
                        loan: {
                            OR: [
                                { loanNumber: { contains: search, mode: 'insensitive' } },
                                {
                                    client: {
                                        OR: [
                                            { firstName: { contains: search, mode: 'insensitive' } },
                                            { lastName: { contains: search, mode: 'insensitive' } }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
        }

        // Filtro por Fecha
        if (startDate || endDate) {
            const dateFilter: any = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start.getTime())) {
                    start.setHours(0, 0, 0, 0);
                    dateFilter.gte = start;
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end.getTime())) {
                    end.setHours(23, 59, 59, 999);
                    dateFilter.lte = end;
                }
            }
            if (Object.keys(dateFilter).length > 0) {
                conditions.push({ paymentDate: dateFilter });
            }
        }

        if (session.user.role === 'CLIENTE') {
            const clientProfile = await tenantPrisma.client.findFirst({
                where: { userId: session.user.id }
            });
            if (!clientProfile) {
                return NextResponse.json({ payments: [], total: 0 });
            }
            conditions.push({
                loan: { clientId: clientProfile.id }
            });
        } else if (session.user.role === 'ASESOR' || (advisorId && advisorId !== 'all')) {
            const filterAsesorId = session.user.role === 'ASESOR' ? session.user.id : advisorId!;
            conditions.push({
                loan: { client: { asesorId: filterAsesorId } }
            });
        }

        const whereClause = conditions.length > 0 ? { AND: conditions } : {};

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
                                    asesor: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            tenantPrisma.payment.count({ where: whereClause })
        ]);

        // Calcular stats de forma segura (sin groupBy si hay filtros de relación que Prisma no soporta bien en groupBy)
        let statsMap: any = {};
        try {
            const stats = await tenantPrisma.payment.groupBy({
                where: whereClause, by: ['status'],
                _count: { status: true }, _sum: { amount: true }
            });
            statsMap = Object.fromEntries(stats.map(s => [s.status, {
                count: s._count.status, amount: Number(s._sum.amount || 0)
            }]));
        } catch (statsError) {
            console.error('Error calculating payment stats:', statsError);
            // Non-blocking error for stats
        }

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
                totalAmount: Object.values(statsMap).reduce((sum: any, s: any) => sum + (s as any).amount, 0)
            }
        });

    } catch (error) {
        if (error instanceof RangeError) return NextResponse.json({ error: error.message }, { status: 400 });
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
