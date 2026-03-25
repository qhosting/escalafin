import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import WahaService from '@/lib/waha';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/waha/session
 * Obtiene el estado actual de la sesión de WhatsApp (incluyendo QR si está pendiente)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const wahaService = new WahaService(session.user.tenantId);
    const status = await wahaService.getSessionStatus();

    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('Error getting WAHA session:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado de sesión', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/waha/session
 * Inicia o detiene la sesión de WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { action } = await request.json();
    const wahaService = new WahaService(session.user.tenantId);

    if (action === 'start') {
      const result = await wahaService.start();
      return NextResponse.json({ success: true, result });
    } else if (action === 'logout') {
      const result = await wahaService.logout();
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in WAHA session action:', error);
    return NextResponse.json(
      { error: 'Error en la acción de sesión', details: error.message },
      { status: 500 }
    );
  }
}
