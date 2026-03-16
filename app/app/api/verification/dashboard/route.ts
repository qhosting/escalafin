
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { identityVerificationService } from '@/lib/identity-verification-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const stats = await identityVerificationService.getDashboard(session.user.tenantId || '');
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching KYC dashboard:', error);
    return NextResponse.json({ error: 'Error al cargar dashboard' }, { status: 500 });
  }
}
