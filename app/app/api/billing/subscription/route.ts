
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.tenantId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
        where: { tenantId: session.user.tenantId },
        include: { plan: true }
    });

    if (!subscription) {
        // Should not happen for active tenants, but handle it
        return NextResponse.json({ isSubscribed: false });
    }

    // Check Stripe status if needed, but local DB should be source of truth via webhooks
    const isPro = subscription.status === 'ACTIVE' && subscription.plan.name !== 'FREE';

    let stripePortalUrl = null;
    if (subscription.stripeCustomerId && subscription.stripeSubscriptionId) {
        // Create portal session for managing subscription
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/admin/billing/subscription`,
        });
        stripePortalUrl = portalSession.url;
    }

    return NextResponse.json({
        ...subscription,
        isPro,
        stripePortalUrl
    });
}
