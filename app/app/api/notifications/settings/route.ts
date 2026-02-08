import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationChannel } from '@prisma/client';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.userNotificationSetting.findMany({
            where: { userId: session.user.id }
        });
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, channel, enabled } = await req.json();

    if (!type || !channel) {
        return NextResponse.json({ error: 'Missing type or channel' }, { status: 400 });
    }

    try {
        const setting = await prisma.userNotificationSetting.upsert({
            where: {
                userId_type_channel: {
                    userId: session.user.id,
                    type: type as NotificationType,
                    channel: channel as NotificationChannel,
                },
            },
            update: { enabled },
            create: {
                userId: session.user.id,
                type: type as NotificationType,
                channel: channel as NotificationChannel,
                enabled,
            },
        });

        return NextResponse.json(setting);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
