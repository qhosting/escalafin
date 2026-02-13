export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        // Obtener préstamos con cuotas vencidas (no pagadas y fecha de pago pasada)
        const now = new Date();

        const overdueSchedules = await tenantPrisma.amortizationSchedule.findMany({
            where: {
                isPaid: false,
                paymentDate: {
                    lt: now
                },
                loan: {
                    status: 'ACTIVE'
                }
            },
            include: {
                loan: {
                    include: {
                        client: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                paymentDate: 'asc'
            }
        });

        // Agrupar por préstamo para el reporte
        const loansMap = new Map();
        let totalOverdueAmount = 0;
        let criticalLoansCount = 0;

        overdueSchedules.forEach(schedule => {
            const loanId = schedule.loanId;
            const daysOverdue = Math.floor((now.getTime() - new Date(schedule.paymentDate).getTime()) / (1000 * 60 * 60 * 24));

            if (!loansMap.has(loanId)) {
                loansMap.set(loanId, {
                    id: loanId,
                    loanNumber: schedule.loan.loanNumber,
                    client: schedule.loan.client,
                    dueAmount: 0,
                    daysOverdue: daysOverdue,
                    lastPaymentDate: null, // Podríamos buscarlo si fuera necesario
                    status: schedule.loan.status
                });
            }

            const loanData = loansMap.get(loanId);
            loanData.dueAmount += parseFloat(schedule.totalPayment.toString());
            totalOverdueAmount += parseFloat(schedule.totalPayment.toString());

            if (daysOverdue > loanData.daysOverdue) {
                loanData.daysOverdue = daysOverdue;
            }

            if (daysOverdue > 30) {
                criticalLoansCount++;
            }
        });

        const reportData = {
            loans: Array.from(loansMap.values()),
            stats: {
                totalOverdue: loansMap.size,
                totalAmount: totalOverdueAmount,
                criticalLoans: criticalLoansCount
            }
        };

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Error fetching due loans report:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
