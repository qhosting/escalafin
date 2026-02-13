
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.tenantId || session.user.role !== 'ADMIN') {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
        return new NextResponse("Plan ID required", { status: 400 });
    }

    try {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return new NextResponse("Plan not found", { status: 404 });

        // Get Active Subscription
        const subscription = await prisma.subscription.findFirst({
            where: { tenantId: session.user.tenantId }
        });

        if (!subscription) {
            return new NextResponse("No subscription found to upgrade", { status: 400 });
        }

        // Create Invoice for the Upgrade
        const invoice = await prisma.invoice.create({
            data: {
                subscriptionId: subscription.id,
                invoiceNumber: `INV-${Date.now()}`, // Simple generation
                amount: plan.priceMonthly, // Proration logic omitted for MVP
                subtotal: plan.priceMonthly,
                dueDate: new Date(),
                status: 'DRAFT',
                currency: 'MXN',
                notes: `Upgrade to ${plan.displayName}`,
                // We store the target planId in the invoice notes or separate field? 
                // Invoice doesn't have metadata field. 
                // We'll trust the "Confirm" step to pass the planId again or store it in redis/temp.
                // Actually, for Simulation, passing planId in the URL/Frontend is fine.
                // For real webhook, we'd add it to Openpay metadata.
            }
        });

        // Use invoice ID as transaction ref for simulation
        return NextResponse.json({
            url: `/admin/billing/checkout-simulation?transactionId=${invoice.id}&planId=${planId}`,
            transactionId: invoice.id
        });

    } catch (error) {
        console.error("Error creating details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
