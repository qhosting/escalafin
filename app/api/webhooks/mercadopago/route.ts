
import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import prisma from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('data.id') || searchParams.get('id');
        const type = searchParams.get('type') || searchParams.get('topic');

        console.log(`[MP Webhook] Received notification: ID=${id}, Type=${type}`);

        // Solo nos interesan las notificaciones de pagos
        if (type === 'payment' && id) {
            const mp = getMercadoPagoClient();
            const paymentData = await mp.getPayment(id);

            // Solo procesar si el pago está aprobado
            if (paymentData.status === 'approved') {
                const externalRef = paymentData.external_reference;

                if (externalRef) {
                    try {
                        const metadata = JSON.parse(externalRef);
                        const { loanId, amortizationId, userId } = metadata;

                        // Evitar duplicados revisando si ya procesamos esta transacción
                        const existingTx = await prisma.paymentTransaction.findUnique({
                            where: {
                                provider_providerTransactionId: {
                                    provider: 'MERCADOPAGO' as any,
                                    providerTransactionId: id.toString()
                                }
                            }
                        });

                        if (!existingTx) {
                            // Iniciar transacción de base de datos
                            await prisma.$transaction(async (tx) => {
                                // 1. Crear el registro del pago
                                const payment = await tx.payment.create({
                                    data: {
                                        loanId,
                                        amortizationScheduleId: amortizationId || null,
                                        amount: paymentData.transaction_amount,
                                        paymentDate: new Date(paymentData.date_approved),
                                        paymentMethod: 'ONLINE' as PaymentMethod,
                                        status: 'COMPLETED',
                                        reference: `MP-${id}`,
                                        processedBy: userId,
                                        notes: `Pago automático via Mercado Pago. ID: ${id}`
                                    }
                                });

                                // 2. Registrar la transacción detallada
                                await tx.paymentTransaction.create({
                                    data: {
                                        paymentId: payment.id,
                                        provider: 'MERCADOPAGO' as any,
                                        providerTransactionId: id.toString(),
                                        amount: paymentData.transaction_amount,
                                        status: 'COMPLETED',
                                        providerResponse: JSON.stringify(paymentData)
                                    }
                                });

                                // 3. Si es una cuota específica, marcar como pagada
                                if (amortizationId) {
                                    await tx.amortizationSchedule.update({
                                        where: { id: amortizationId },
                                        data: { isPaid: true }
                                    });
                                }

                                // 4. Actualizar el saldo restante del préstamo
                                await tx.loan.update({
                                    where: { id: loanId },
                                    data: {
                                        balanceRemaining: {
                                            decrement: paymentData.transaction_amount
                                        }
                                    }
                                });

                                console.log(`[MP Webhook] Payment ${id} processed successfully for loan ${loanId}`);
                            });
                        }
                    } catch (e) {
                        console.error('[MP Webhook] Error parsing metadata or processing transaction:', e);
                    }
                }
            }
        }

        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[MP Webhook] Global Error:', error);
        // Respondemos con 200 para que MP no reintente infinitamente si el error es de lógica
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}
