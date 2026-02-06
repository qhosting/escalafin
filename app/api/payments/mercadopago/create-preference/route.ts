
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMercadoPagoClient, PreferenceRequest } from '@/lib/mercadopago';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { loanId, amortizationId, amount, description } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }

        // 1. Obtener detalles del cliente y préstamo
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { client: true }
        });

        if (!loan) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        const client = loan.client;
        const mp = getMercadoPagoClient();

        // 2. Definir la URL de retorno (debe ser accesible desde internet en producción)
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // 3. Crear preferencia
        const preferenceData: PreferenceRequest = {
            items: [
                {
                    title: description || `Pago de Préstamo ${loan.loanNumber}`,
                    quantity: 1,
                    unit_price: parseFloat(amount),
                    currency_id: 'MXN',
                }
            ],
            payer: {
                name: client.firstName,
                surname: client.lastName,
                email: client.email || '',
            },
            external_reference: JSON.stringify({
                loanId,
                amortizationId,
                userId: session.user.id,
                type: amortizationId ? 'INSTALLMENT' : 'PRINCIPAL_ONLY'
            }),
            back_urls: {
                success: `${appUrl}/payments/success`,
                failure: `${appUrl}/payments/failure`,
                pending: `${appUrl}/payments/pending`,
            },
            auto_return: 'approved',
            notification_url: `${appUrl}/api/webhooks/mercadopago`, // Webhook IPN
        };

        const preference = await mp.createPreference(preferenceData);

        return NextResponse.json({
            id: preference.id,
            init_point: preference.init_point,
            sandbox_init_point: preference.sandbox_init_point
        });

    } catch (error: any) {
        console.error('Error in Mercado Pago API:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
