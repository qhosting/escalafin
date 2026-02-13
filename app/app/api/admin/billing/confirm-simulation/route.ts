
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.tenantId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { transactionId, planId } = await req.json(); // transactionId is Invoice ID

        if (!transactionId || !planId) {
            return new NextResponse("Invalid request", { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: transactionId },
            include: { subscription: true }
        });

        if (!invoice || invoice.status === 'PAID' || invoice.subscription.tenantId !== session.user.tenantId) {
            return new NextResponse("Invoice invalid or already paid", { status: 400 });
        }

        // Simulate successful payment confirmation
        await prisma.$transaction(async (tx) => {
            // Update Invoice
            await tx.invoice.update({
                where: { id: transactionId },
                data: {
                    status: 'PAID',
                    paidAt: new Date()
                }
            });

            // Update Subscription to New Plan
            const newPeriodStart = new Date(); // Start usage now
            const newPeriodEnd = new Date();
            newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

            await tx.subscription.update({
                where: { id: invoice.subscriptionId },
                data: {
                    planId: planId,
                    status: 'ACTIVE',
                    currentPeriodStart: newPeriodStart,
                    currentPeriodEnd: newPeriodEnd,
                    cancelAtPeriodEnd: false
                }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error confirming simulation:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
