export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
        return NextResponse.json({ isSubscribed: false });
    }

    const isPro = subscription.status === 'ACTIVE' && subscription.plan.name !== 'FREE';

    // Openpay management portal URL (if exists) or local manage URL
    const openpayPortalUrl = null;

    return NextResponse.json({
        ...subscription,
        isPro,
        openpayPortalUrl
    });
}
