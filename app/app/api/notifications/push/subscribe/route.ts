import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    try {
        const existingSubscription = await prisma.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint },
        });

        if (existingSubscription) {
            if (existingSubscription.userId !== session.user.id) {
                // Update user if different
                await prisma.pushSubscription.update({
                    where: { id: existingSubscription.id },
                    data: { userId: session.user.id },
                });
            }
            return NextResponse.json({ success: true, message: 'Updated' });
        }

        await prisma.pushSubscription.create({
            data: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userAgent: req.headers.get('user-agent'),
            },
        });

        return NextResponse.json({ success: true, message: 'Subscribed' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
