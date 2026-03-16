
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { identityVerificationService } from '@/lib/identity-verification-service';
import { UserRole } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { action, approved, rejectionReason } = await request.json();

    if (action === 'PROCESS') {
      const result = await identityVerificationService.processVerification(params.id);
      return NextResponse.json(result);
    }

    if (action === 'MANUAL_VERIFY') {
      if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
      }

      const result = await identityVerificationService.manualVerify(
        params.id,
        session.user.id,
        approved,
        rejectionReason
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error processing verification action:', error);
    return NextResponse.json({ error: 'Error al procesar acción' }, { status: 500 });
  }
}
