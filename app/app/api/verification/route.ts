
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { identityVerificationService } from '@/lib/identity-verification-service';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const clientId = searchParams.get('clientId');

    const result = await identityVerificationService.list({
      tenantId: session.user.tenantId || '',
      status: status || undefined,
      clientId: clientId || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Error al cargar verificaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const result = await identityVerificationService.startVerification({
      ...body,
      tenantId: session.user.tenantId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error starting verification:', error);
    return NextResponse.json({ error: 'Error al iniciar verificación' }, { status: 500 });
  }
}
