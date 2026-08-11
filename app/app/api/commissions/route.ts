import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commissionService } from '@/lib/commission-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const type = (searchParams.get('type') as any) || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await commissionService.list({
      tenantId: session.user.tenantId,
      advisorId,
      status,
      type,
      page,
      limit
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Error al cargar comisiones', details: error.message }, { status: 500 });
  }
}
