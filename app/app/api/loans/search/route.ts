export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || searchParams.get('search') || '';

        const loans = await tenantPrisma.loan.findMany({
            where: {
                OR: [
                    { loanNumber: { contains: q, mode: 'insensitive' } },
                    {
                        client: {
                            OR: [
                                { firstName: { contains: q, mode: 'insensitive' } },
                                { lastName: { contains: q, mode: 'insensitive' } }
                            ]
                        }
                    }
                ]
            },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            take: 20
        });

        return NextResponse.json(loans);

    } catch (error) {
        console.error('Error in loan search API:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
