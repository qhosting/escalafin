export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
        }

        const tenantPrisma = getTenantPrisma(tenantId);
        const { searchParams } = new URL(request.url);

        const collectorId = searchParams.get('collectorId');
        const dateFrom = searchParams.get('dateFrom') || searchParams.get('startDate');
        const dateTo = searchParams.get('dateTo') || searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');

        const conditions: any[] = [{ paymentMethod: 'CASH' }];

        if (collectorId && collectorId !== 'all') {
            conditions.push({ processedBy: collectorId });
        }

        if (dateFrom || dateTo) {
            const dateFilter: any = {};
            if (dateFrom) {
                const start = new Date(dateFrom.includes('T') ? dateFrom : `${dateFrom}T00:00:00`);
                if (!isNaN(start.getTime())) dateFilter.gte = start;
            }
            if (dateTo) {
                const end = new Date(dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999`);
                if (!isNaN(end.getTime())) dateFilter.lte = end;
            }
            if (Object.keys(dateFilter).length > 0) {
                conditions.push({ paymentDate: dateFilter });
            }
        }

        const whereClause = { AND: conditions };

        const [payments, totalCount, aggregate] = await Promise.all([
            tenantPrisma.payment.findMany({
                where: whereClause,
                orderBy: { paymentDate: 'desc' },
                take: limit,
                include: {
                    loan: {
                        select: {
                            id: true,
                            loanNumber: true,
                            balanceRemaining: true,
                            client: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    phone: true,
                                    address: true
                                }
                            }
                        }
                    }
                }
            }),
            tenantPrisma.payment.count({ where: whereClause }),
            tenantPrisma.payment.aggregate({
                where: whereClause,
                _sum: { amount: true }
            })
        ]);

        const totalAmount = Number(aggregate._sum?.amount || 0);

        return NextResponse.json({
            payments,
            total: totalCount,
            stats: {
                totalPayments: totalCount,
                totalAmount
            }
        });
    } catch (error) {
        console.error('Error fetching cash payments:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is missing' }, { status: 400 });
        }

        const tenantPrisma = getTenantPrisma(tenantId);
        const whatsappService = new WhatsAppNotificationService(tenantId);

        const contentType = request.headers.get('content-type') || '';
        let loanId: string;
        let amountRaw: any;
        let paymentDateStr: string | null;
        let notes: string | null;
        let receiptNumber: string | null;
        let collectionMethod: string | null;
        let collectorLocation: string | null;
        let lateFeePaidRaw: any;
        let penaltyIdsRaw: string | null;

        if (contentType.includes('application/json')) {
            try {
                const body = await request.json();
                loanId = body.loanId;
                amountRaw = body.amount;
                paymentDateStr = body.paymentDate;
                notes = body.notes;
                receiptNumber = body.receiptNumber;
                collectionMethod = body.collectionMethod;
                collectorLocation = body.collectorLocation;
                lateFeePaidRaw = body.lateFeePaid;
                penaltyIdsRaw = body.penaltyIds ? (typeof body.penaltyIds === 'string' ? body.penaltyIds : JSON.stringify(body.penaltyIds)) : null;
            } catch (e) {
                return NextResponse.json({ error: 'Error al parsear el cuerpo JSON' }, { status: 400 });
            }
        } else {
            let formData;
            try {
                formData = await request.formData();
            } catch (e) {
                return NextResponse.json({ error: 'Se requiere multipart/form-data o application/json con los detalles del pago' }, { status: 400 });
            }

            loanId = formData.get('loanId') as string;
            amountRaw = formData.get('amount');
            paymentDateStr = formData.get('paymentDate') as string | null;
            notes = formData.get('notes') as string | null;
            receiptNumber = formData.get('receiptNumber') as string | null;
            collectionMethod = formData.get('collectionMethod') as string | null; 
            collectorLocation = formData.get('collectorLocation') as string | null;
            lateFeePaidRaw = formData.get('lateFeePaid');
            penaltyIdsRaw = formData.get('penaltyIds') as string | null;
        }

        const processedBy = session.user.id;

        if (!loanId || !amountRaw) {
            return NextResponse.json({ error: 'Campos requeridos: loanId, amount' }, { status: 400 });
        }

        const amount = parseFloat(amountRaw.toString());
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        const lateFeePaid = lateFeePaidRaw ? parseFloat(lateFeePaidRaw.toString()) : 0;

        const queryNotes = notes ? notes.trim() : '';

        const loan = await tenantPrisma.loan.findFirst({
            where: { id: loanId, tenantId: tenantId }
        });

        if (!loan) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        // Begin Transaction
        const result: any = await (tenantPrisma as any).$transaction(async (tx: any) => {
            // 1. Create Payment
            const payment = await tx.payment.create({
                data: {
                    tenantId: tenantId,
                    loanId: loanId,
                    amount: amount,
                    paymentDate: paymentDateStr ? new Date(`${paymentDateStr}T12:00:00`) : new Date(),
                    paymentMethod: 'CASH',
                    status: 'COMPLETED',
                    reference: receiptNumber || `EXT-${Date.now()}`,
                    notes: `${queryNotes} | location: ${collectorLocation || 'N/A'} | method: ${collectionMethod || 'N/A'}`,
                    processedBy: processedBy,
                    lateFeePaid: lateFeePaid
                }
            });

            // 1.1 Mark Penalties as Paid
            if (penaltyIdsRaw) {
                try {
                    const penaltyIds = JSON.parse(penaltyIdsRaw);
                    if (Array.isArray(penaltyIds) && penaltyIds.length > 0) {
                        await tx.lateFeePenalty.updateMany({
                            where: {
                                id: { in: penaltyIds },
                                tenantId: tenantId
                            },
                            data: {
                                status: 'COMPLETED',
                                paidAt: new Date(),
                                paymentId: payment.id
                            }
                        });
                    }
                } catch (e) {
                    console.error('Error parsing or processing penaltyIds:', e);
                }
            }

            // 2. Reduce Balance on Loan (Solo el monto que no es mora)
            const amortizedAmount = Math.max(0, amount - lateFeePaid);
            const newBalance = Math.max(0, Number(loan.balanceRemaining) - amortizedAmount);
            const updatedLoan = await tx.loan.update({
                where: { id: loanId },
                data: {
                    balanceRemaining: newBalance,
                    status: newBalance <= 0 ? 'PAID_OFF' : loan.status
                }
            });

            // 3. Auto-assign client to advisor if the user is an advisor
            if (session.user.role === 'ASESOR') {
                await tx.client.update({
                    where: { id: loan.clientId },
                    data: { asesorId: processedBy }
                });
            }

            return { payment, updatedLoan };
        });

        // WhatsApp Notification (non-blocking)
        try {
            await whatsappService.sendPaymentReceivedNotification(result.payment.id);
        } catch (wsError) {
            console.error('Error al enviar notificación WhatsApp:', wsError);
        }

        // 💵 Cálculo de comisión por cobranza (non-blocking)
        try {
            const { commissionService } = await import('@/lib/commission-service');
            const client = await tenantPrisma.client.findUnique({ where: { id: loan.clientId }, select: { asesorId: true } });
            const advisorId = client?.asesorId || (session.user.role === 'ASESOR' ? session.user.id : null);
            if (advisorId) {
                await commissionService.calculateCollectionCommission(result.payment.id, advisorId, tenantId);
            }
        } catch (commError) {
            console.error('Error calculando comisión por cobranza:', commError);
        }

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('Error processing cash payment:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
