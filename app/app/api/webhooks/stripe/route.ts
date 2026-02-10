
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

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

        // Update Subscription in DB
        await prisma.subscription.update({
            where: {
                tenantId: tenantId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                status: 'ACTIVE',
                planId: planId,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        });
    }

    if (event.type === 'invoice.payment_succeeded') {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        // Update period end
        await prisma.subscription.update({
            where: {
                stripeSubscriptionId: subscription.id,
            },
            data: {
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                status: 'ACTIVE'
            },
        });
    }

    return new NextResponse(null, { status: 200 });
}
