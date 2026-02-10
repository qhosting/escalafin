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

        // TODO: Implement Openpay Checkout logic
        // For now, return a placeholder or redirect to a manual payment info page

        console.log(`Openpay checkout initiated for plan ${plan.name} by tenant ${tenant.name}`);

        return NextResponse.json({
            error: 'Checkout con Openpay en desarrollo. Contacte a soporte para activación manual.',
            url: '/admin/billing/subscription'
        });
    } catch (error) {
        console.error('[OPENPAY_CHECKOUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
