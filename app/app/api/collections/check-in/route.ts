export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const body = await request.json();
    const { clientId, latitude, longitude, address, notes, outcome } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const visit = await (tenantPrisma as any).collectionVisit.create({
      data: {
        clientId,
        advisorId: session.user.id,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address,
        notes,
        outcome: outcome || 'VISIT',
        visitDate: new Date(),
      }
    });

    return NextResponse.json({ success: true, visit }, { status: 201 });
  } catch (error) {
    console.error('Error in collection check-in:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
