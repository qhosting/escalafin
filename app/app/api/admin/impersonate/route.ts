import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const requesterId = (session.user as any).originalUser?.id || session.user.id;

    // 🛡️ 1. Validación estricta en base de datos de identidad del Super Admin
    const dbSuperAdmin = await prisma.user.findUnique({
      where: { id: requesterId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!dbSuperAdmin || dbSuperAdmin.role !== UserRole.SUPER_ADMIN || dbSuperAdmin.status !== 'ACTIVE') {
      console.warn(`🛡️ SEGURIDAD: Intento de acceso a intrapersona rechazado para el ID: ${requesterId}`);
      await AuditLogger.quickLog(
        req,
        'LOGIN',
        {
          action: 'SECURITY_ALERT_UNAUTHORIZED_IMPERSONATION',
          attemptedBy: requesterId,
          role: session.user.role,
        },
        'Security',
        requesterId,
        session
      ).catch(() => {});

      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere cuenta SUPER_ADMIN activa verificada en base de datos.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, targetUserId } = body;

    // 🎭 Acción 1: Iniciar Intrapersona
    if (action === 'impersonate' && targetUserId) {
      const sanitizedTargetId = String(targetUserId).trim();

      // Sanitización contra inyección
      if (!/^[a-zA-Z0-9_-]{8,64}$/.test(sanitizedTargetId)) {
        return NextResponse.json({ error: 'Identificador de usuario inválido' }, { status: 400 });
      }

      // Prohibir auto-suplantación
      if (sanitizedTargetId === dbSuperAdmin.id) {
        return NextResponse.json({ error: 'No es necesario suplantar tu propia cuenta' }, { status: 400 });
      }

      // Validar usuario objetivo en DB
      const targetUser = await prisma.user.findUnique({
        where: { id: sanitizedTargetId },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 });
      }

      if (targetUser.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'El usuario objetivo se encuentra inactivo o suspendido' }, { status: 400 });
      }

      // Prohibir suplantar a otro Super Admin
      if (targetUser.role === UserRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Por motivos de seguridad no se permite intrapersona sobre otras cuentas Super Admin' },
          { status: 403 }
        );
      }

      // Registrar en log de auditoría
      await AuditLogger.quickLog(
        req,
        'LOGIN',
        {
          action: 'IMPERSONATION_STARTED',
          superAdminId: dbSuperAdmin.id,
          superAdminEmail: dbSuperAdmin.email,
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
          targetRole: targetUser.role,
          tenantId: targetUser.tenantId,
          tenantSlug: targetUser.tenant?.slug,
        },
        'Security',
        targetUser.id,
        session
      ).catch(() => {});

      // Determinar la mejor ruta de redirección según el rol asumido
      let redirectUrl = '/admin/dashboard';
      if (targetUser.role === UserRole.ASESOR) {
        redirectUrl = '/pwa';
      } else if (targetUser.role === UserRole.CLIENTE) {
        redirectUrl = '/pwa';
      } else if (targetUser.role === UserRole.ADMIN) {
        redirectUrl = '/admin/dashboard';
      }

      return NextResponse.json({
        success: true,
        redirectUrl,
        targetUser: {
          id: targetUser.id,
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          role: targetUser.role,
          email: targetUser.email,
          tenantName: targetUser.tenant?.name || null,
        },
      });
    }

    // 🛑 Acción 2: Finalizar Intrapersona
    if (action === 'stopImpersonate') {
      await AuditLogger.quickLog(
        req,
        'LOGOUT',
        {
          action: 'IMPERSONATION_STOPPED',
          superAdminId: dbSuperAdmin.id,
          superAdminEmail: dbSuperAdmin.email,
          impersonatedUserId: session.user.id,
        },
        'Security',
        session.user.id,
        session
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        redirectUrl: '/admin/users',
        message: 'Sesión de intrapersona finalizada correctamente',
      });
    }

    return NextResponse.json({ error: 'Acción no válida o parámetros incompletos' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en endpoint de auditoría intrapersona:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
