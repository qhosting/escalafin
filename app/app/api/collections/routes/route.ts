
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collectionRouteService } from '@/lib/collection-route-service';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId');
    const status = searchParams.get('status') as any;
    const dateStr = searchParams.get('date');

    const results = await collectionRouteService.getRoutes({
      tenantId: session.user.tenantId || '',
      advisorId: advisorId || undefined,
      status: status || undefined,
      date: dateStr ? new Date(dateStr) : undefined,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching collection routes:', error);
    return NextResponse.json({ error: 'Error al cargar rutas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === UserRole.CLIENTE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { advisorId, name, date, clientIds, autoOptimize, maxVisits } = body;

    const result = await collectionRouteService.createRoute({
      advisorId: advisorId || session.user.id,
      tenantId: session.user.tenantId || '',
      name: name || `Ruta ${new Date().toLocaleDateString()}`,
      date: date ? new Date(date) : new Date(),
      clientIds,
      autoOptimize: autoOptimize ?? true,
      maxVisits: maxVisits || 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating collection route:', error);
    return NextResponse.json({ error: 'Error al crear la ruta' }, { status: 500 });
  }
}
