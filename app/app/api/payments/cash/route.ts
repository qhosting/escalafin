export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

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

        // Validate FormData vs JSON depending on how it's sent. Let's try FormData first since the component sends FormData
        let formData;
        try {
            formData = await request.formData();
        } catch (e) {
            return NextResponse.json({ error: 'Se requiere multipart/form-data con los detalles del pago' }, { status: 400 });
        }

        const loanId = formData.get('loanId') as string;
        const clientId = formData.get('clientId') as string;
        const amountRaw = formData.get('amount');
        const paymentDateStr = formData.get('paymentDate') as string;
        const notes = formData.get('notes') as string | null;
        const receiptNumber = formData.get('receiptNumber') as string | null;
        const collectionMethod = formData.get('collectionMethod') as string | null; // e.g. home, office, field
        const collectorLocation = formData.get('collectorLocation') as string | null;

        // We register the person receiving the payment as the current session user
        const processedBy = session.user.id;

        if (!loanId || !amountRaw) {
            return NextResponse.json({ error: 'Campos requeridos: loanId, amount' }, { status: 400 });
        }

        const amount = parseFloat(amountRaw.toString());
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        const queryNotes = notes ? notes.trim() : '';

        const loan = await tenantPrisma.loan.findFirst({
            where: { id: loanId, tenantId: tenantId }
        });

        if (!loan) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        // Begin Transaction to save Payment and reduce Loan Balance
        const result = await tenantPrisma.$transaction(async (prismaTx) => {
            // 1. Create Payment
            const payment = await prismaTx.payment.create({
                data: {
                    tenantId: tenantId,
                    loanId: loanId,
                    amount: amount,
                    paymentDate: paymentDateStr ? new Date(paymentDateStr) : new Date(),
                    paymentMethod: 'CASH', // Enum value
                    status: 'COMPLETED',
                    reference: receiptNumber || `EXT-${Date.now()}`,
                    notes: `${queryNotes} | location: ${collectorLocation || 'N/A'} | method: ${collectionMethod || 'N/A'}`,
                    processedBy: processedBy
                }
            });

            // 2. Reduce Balance on Loan
            const newBalance = Math.max(0, Number(loan.balanceRemaining) - amount);
            const updatedLoan = await prismaTx.loan.update({
                where: { id: loanId },
                data: {
                    balanceRemaining: newBalance,
                    // If the balance drops to 0 or below, set it to PAID_OFF 
                    status: newBalance <= 0 ? 'PAID_OFF' : loan.status
                }
            });

            return { payment, updatedLoan };
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('Error processing cash payment:', error);
        return NextResponse.json({ error: 'Error interno del servidor al procesar el pago en efectivo' }, { status: 500 });
    }
}
