
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const generations = await prisma.customReportGeneration.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                template: {
                    select: {
                        name: true,
                        category: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });

        return NextResponse.json(generations);
    } catch (error) {
        console.error('Error fetching report history:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
