export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { RelationshipType, NotificationPreference } from '@prisma/client';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');

        if (!clientId) {
            return NextResponse.json({ error: 'clientId es requerido' }, { status: 400 });
        }

        const references = await tenantPrisma.personalReference.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(references);

    } catch (error) {
        console.error('Error fetching personal references:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        const body = await request.json();
        const {
            clientId,
            fullName,
            relationship,
            relationshipOther,
            phone,
            address,
            notificationPreference
        } = body;

        if (!clientId || !fullName || !phone || !relationship) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
        }

        const reference = await tenantPrisma.personalReference.create({
            data: {
                clientId,
                fullName,
                relationship: relationship as RelationshipType,
                relationshipOther: relationshipOther || null,
                phone,
                address: address || null,
                notificationPreference: (notificationPreference as NotificationPreference) || 'WHATSAPP'
            }
        });

        return NextResponse.json(reference, { status: 201 });

    } catch (error) {
        console.error('Error creating personal reference:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
