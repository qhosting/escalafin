
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WahaService } from '@/lib/waha';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const wahaService = new WahaService(session.user.tenantId);
    const status = await wahaService.getSessionStatus();

    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error fetching WAHA status:', error);
    return NextResponse.json(
      { error: 'Error al conectar con la instancia de WhatsApp' },
      { status: 500 }
    );
  }
}
