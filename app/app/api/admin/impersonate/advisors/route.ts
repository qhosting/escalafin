import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Permitir solo a SuperAdmin (o usuario que originalmente es SuperAdmin)
    const isSuperAdmin =
      session.user.role === 'SUPER_ADMIN' ||
      (session.user as any).originalUser?.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' },
        { status: 403 }
      );
    }

    // Obtener asesores activos de cualquier tenant
    const advisors = await prisma.user.findMany({
      where: {
        role: { in: ['ASESOR', 'ADMIN'] },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            clientsAssigned: true,
          },
        },
      },
      orderBy: [
        { tenant: { name: 'asc' } },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      advisors: advisors.map((adv) => ({
        id: adv.id,
        name: `${adv.firstName} ${adv.lastName}`.trim(),
        email: adv.email,
        phone: adv.phone,
        role: adv.role,
        tenantId: adv.tenantId,
        tenantName: adv.tenant?.name || 'Global',
        tenantSlug: adv.tenant?.slug || null,
        clientCount: adv._count.clientsAssigned,
      })),
    });
  } catch (error: any) {
    console.error('Error al obtener lista de asesores para intrapersona:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar asesores', details: error.message },
      { status: 500 }
    );
  }
}
