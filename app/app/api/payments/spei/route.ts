export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

/**
 * POST /api/payments/spei
 * Registra un pago por transferencia SPEI de forma manual.
 * Acepta multipart/form-data igual que /api/payments/cash.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID faltante' }, { status: 400 });
        }

        const tenantPrisma = getTenantPrisma(tenantId);

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json({ error: 'Se requiere multipart/form-data' }, { status: 400 });
        }

        const loanId = formData.get('loanId') as string;
        const amountRaw = formData.get('amount');
        const paymentDateStr = formData.get('paymentDate') as string | null;
        const notes = formData.get('notes') as string | null;
        const reference = formData.get('receiptNumber') as string | null;
        const processedBy = session.user.id;

        if (!loanId || !amountRaw) {
            return NextResponse.json({ error: 'Campos requeridos: loanId, amount' }, { status: 400 });
        }

        const amount = parseFloat(amountRaw.toString());
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        const loan = await tenantPrisma.loan.findFirst({
            where: { id: loanId, tenantId }
        });

        if (!loan) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        const result = await tenantPrisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    tenantId,
                    loanId,
                    amount,
                    paymentDate: paymentDateStr ? new Date(paymentDateStr) : new Date(),
                    paymentMethod: 'SPEI',
                    status: 'COMPLETED',
                    reference: reference || `SPEI-${Date.now()}`,
                    notes: notes?.trim() || null,
                    processedBy,
                }
            });

            const newBalance = Math.max(0, Number(loan.balanceRemaining) - amount);
            const updatedLoan = await tx.loan.update({
                where: { id: loanId },
                data: {
                    balanceRemaining: newBalance,
                    status: newBalance <= 0 ? 'PAID_OFF' : loan.status,
                }
            });

            return { payment, updatedLoan };
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('Error registering SPEI payment:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
