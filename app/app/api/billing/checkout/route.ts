
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { planId, interval } = body;

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

        // Get the plan
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return new NextResponse('Plan not found', { status: 404 });
        }

        // Ensure we have a Stripe Customer ID
        let stripeCustomerId = tenant.subscription?.stripeCustomerId;

        if (!stripeCustomerId) {
            // Create a new customer in Stripe
            const customer = await stripe.customers.create({
                email: session.user.email || undefined,
                name: tenant.name,
                metadata: {
                    tenantId: tenant.id,
                }
            });
            stripeCustomerId = customer.id;

            // Update local subscription with customer ID
            if (tenant.subscription) {
                await prisma.subscription.update({
                    where: { id: tenant.subscription.id },
                    data: { stripeCustomerId }
                });
            } else {
                // If no subscription exists at all (weird edge case), create placeholder
                await prisma.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        planId: plan.id, // Current plan or default
                        status: 'TRIALING',
                        stripeCustomerId,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(),
                    }
                });
            }
        }

        // Validate plan has Stripe Price ID
        if (!plan.stripePriceId || !plan.stripeProductId) {
            // Fallback:Create dynamic price if missing (Development helper)
            // In production, prices should be synced.
            console.log(`Plan ${plan.name} missing Stripe ID. Creating...`);
            const product = await stripe.products.create({
                name: plan.displayName,
                description: plan.description || undefined,
            });

            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: Number(plan.priceMonthly) * 100, // cents
                currency: 'mxn',
                recurring: { interval: 'month' },
            });

            // Update plan with new IDS
            await prisma.plan.update({
                where: { id: plan.id },
                data: { stripeProductId: product.id, stripePriceId: price.id }
            });

            plan.stripePriceId = price.id;
        }

        // Create Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: plan.stripePriceId!,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXTAUTH_URL}/admin/billing/subscription?success=true`,
            cancel_url: `${process.env.NEXTAUTH_URL}/admin/billing/subscription?canceled=true`,
            metadata: {
                tenantId: tenant.id,
                planId: plan.id,
            },
            subscription_data: {
                metadata: {
                    tenantId: tenant.id,
                    planId: plan.id,
                }
            }
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error('[STRIPE_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
