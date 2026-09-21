import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const isSuperAdmin =
      session.user.role === 'SUPER_ADMIN' ||
      (session.user as any).originalUser?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId } = body;

    if (action === 'impersonate' && targetUserId) {
      await AuditLogger.quickLog(
        req,
        'LOGIN',
        {
          action: 'IMPERSONATION_REQUEST',
          superAdminId: (session.user as any).originalUser?.id || session.user.id,
          targetUserId,
        },
        'Security',
        targetUserId,
        session
      ).catch(() => {});

      return NextResponse.json({ success: true, message: 'Auditoría registrada para intrapersona' });
    }

    if (action === 'stopImpersonate') {
      await AuditLogger.quickLog(
        req,
        'LOGOUT',
        {
          action: 'IMPERSONATION_STOPPED',
          superAdminId: (session.user as any).originalUser?.id || session.user.id,
          revertedUserId: session.user.id,
        },
        'Security',
        session.user.id,
        session
      ).catch(() => {});

      return NextResponse.json({ success: true, message: 'Auditoría registrada para fin de intrapersona' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en endpoint de auditoría intrapersona:', error);
    return NextResponse.json({ error: 'Error interno', details: error.message }, { status: 500 });
  }
}
