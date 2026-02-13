
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.tenantId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const tenantId = session.user.tenantId;

    try {
        // 1. Get Active Subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                tenantId: tenantId,
                status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }
            },
            include: {
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!subscription) {
            return new NextResponse("Subscription not found", { status: 404 });
        }

        // 2. Get Usage for Current Period
        const currentPeriod = format(new Date(), 'yyyy-MM');

        // Ensure usage record exists (or get partial data from aggregations if prefered, but usage table is faster)
        // Here specific logic: UsageTracker updates this table on every action.
        let usage = await prisma.tenantUsage.findUnique({
            where: {
                tenantId_period: {
                    tenantId: tenantId,
                    period: currentPeriod
                }
            }
        });

        // Fallback: If no usage record for this month (e.g. first day of month and no activity yet), return zeros or aggregate
        if (!usage) {
            // Optional: Calculate real-time counts if critical, otherwise return 0
            const usersCount = await prisma.user.count({ where: { tenantId } });
            const loansCount = await prisma.loan.count({
                where: {
                    tenantId,
                    status: 'ACTIVE' // Count active loans against limit? Or created this month? 
                    // Usually SaaS limits are on "Active Loans" or "Total Clients" database size, not just monthly activity.
                    // Let's assume the limit is on TOTAL active resources for now based on Plan Limits structure (e.g. 100 loans max).
                }
            });
            const clientsCount = await prisma.client.count({ where: { tenantId } });

            // Return "calculated" usage if the tracking record isn't there yet
            // To be robust, we might want to UPSERT this into TenantUsage, but for GET just returning is fine.
            usage = {
                usersCount,
                loansCount,
                clientsCount,
                storageBytes: BigInt(0),
                apiCalls: 0,
                smsCount: 0,
                whatsappCount: 0,
                reportsCount: 0,
            } as any;
        }

        // Return combined data
        return NextResponse.json({
            ...subscription,
            usage: {
                ...usage,
                storage: Number(usage?.storageBytes ?? 0) / (1024 * 1024 * 1024) // Convert to GB for frontend
            }
        });

    } catch (error) {
        console.error("Error fetching subscription:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
