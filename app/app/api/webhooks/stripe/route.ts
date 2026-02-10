
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

/**
 * Helper: extrae current_period_end de la suscripción de Stripe
 * En versiones recientes del SDK, esta propiedad puede no estar tipada directamente.
 */
function getSubscriptionPeriodEnd(subscription: Record<string, any>): Date {
    const ts = subscription.current_period_end || subscription.ended_at || Math.floor(Date.now() / 1000);
    return new Date(ts * 1000);
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        const tenantId = session.metadata?.tenantId;
        const planId = session.metadata?.planId;

        if (!tenantId || !planId) {
            return new NextResponse('Webhook Error: Missing metadata', { status: 400 });
        }

        // Update Subscription in DB (tenantId es @unique en el schema)
        await prisma.subscription.update({
            where: {
                tenantId: tenantId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                status: 'ACTIVE',
                planId: planId,
                currentPeriodEnd: getSubscriptionPeriodEnd(subscription as unknown as Record<string, any>),
            },
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        // Para invoice.payment_succeeded, el objeto es Invoice, no Session
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;

        if (!stripeSubId) {
            return new NextResponse(null, { status: 200 });
        }

        const subscription = await stripe.subscriptions.retrieve(stripeSubId);

        // Buscar por stripeSubscriptionId (no es @unique, usar findFirst)
        const existingSub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscription.id },
        });

        if (existingSub) {
            await prisma.subscription.update({
                where: { id: existingSub.id },
                data: {
                    currentPeriodEnd: getSubscriptionPeriodEnd(subscription as unknown as Record<string, any>),
                    status: 'ACTIVE'
                },
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}
