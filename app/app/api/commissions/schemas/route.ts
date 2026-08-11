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

    const schemas = await commissionService.listSchemas(session.user.tenantId);
    return NextResponse.json({ success: true, schemas });
  } catch (error: any) {
    console.error('Error fetching commission schemas:', error);
    return NextResponse.json({ error: 'Error al cargar esquemas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, rules } = body;

    if (!name || !type || !rules) {
      return NextResponse.json({ error: 'Campos requeridos: name, type, rules' }, { status: 400 });
    }

    const schema = await commissionService.createSchema({
      name,
      description,
      type,
      rules,
      tenantId: session.user.tenantId
    });

    return NextResponse.json({ success: true, schema });
  } catch (error: any) {
    console.error('Error creating commission schema:', error);
    return NextResponse.json({ error: error.message || 'Error al crear esquema' }, { status: 500 });
  }
}
