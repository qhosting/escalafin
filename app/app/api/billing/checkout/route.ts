export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { planId } = body;

        if (!planId) {
            return new NextResponse('Plan ID is required', { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            include: { subscription: true }
        });

        if (!tenant) {
            return new NextResponse('Tenant not found', { status: 404 });
        }

        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return new NextResponse('Plan not found', { status: 404 });
        }

        // 1. Create a draft invoice
        const subscription = tenant.subscription;
        if (!subscription) {
            return new NextResponse('Subscription not found', { status: 404 });
        }

        const invoice = await prisma.invoice.create({
            data: {
                subscriptionId: subscription.id,
                amount: plan.priceMonthly,
                subtotal: plan.priceMonthly,
                currency: plan.currency || 'MXN',
                status: 'DRAFT',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days for checkout
                invoiceNumber: `INV-${Date.now()}`,
                lineItems: JSON.stringify([{
                    planId: plan.id,
                    description: `Suscripción Plan ${plan.displayName}`,
                    amount: Number(plan.priceMonthly)
                }])
            }
        });

        // 2. Initialize Openpay charge
        const { getOpenpayClient } = await import('@/lib/openpay');
        const openpay = getOpenpayClient();

        try {
            const charge = await openpay.createCharge({
                method: 'card',
                amount: Number(plan.priceMonthly),
                currency: plan.currency || 'MXN',
                description: `Activación ${plan.displayName} - ${tenant.name}`,
                order_id: invoice.id,
                customer: {
                    name: (session.user.name || 'Usuario').split(' ')[0],
                    last_name: (session.user.name || 'SaaS').split(' ').slice(1).join(' ') || 'SaaS',
                    email: session.user.email,
                },
                redirect_url: `${process.env.NEXTAUTH_URL}/admin/billing/subscription?success=true&invoiceId=${invoice.id}`,
            });

            // 3. Update invoice with charge info
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: 'OPEN',
                    openpayInvoiceId: charge.id,
                    paymentIntent: charge.payment_url
                }
            });

            return NextResponse.json({ url: charge.payment_url });

        } catch (chargeError: any) {
            console.error('Openpay charge error:', chargeError);
            return NextResponse.json({
                error: 'Error al procesar el pago con Openpay. Por favor intente más tarde.'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[OPENPAY_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
