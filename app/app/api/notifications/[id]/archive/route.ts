import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notification = await prisma.notification.update({
            where: {
                id: params.id,
                userId: session.user.id
            },
            data: {
                readAt: new Date()
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error archiving notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
