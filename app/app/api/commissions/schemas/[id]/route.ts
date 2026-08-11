import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commissionService } from '@/lib/commission-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const schemaId = params.id;
    const body = await request.json();
    
    if (typeof body.isActive === 'boolean') {
      const updated = await commissionService.toggleSchema(session.user.tenantId, schemaId, body.isActive);
      return NextResponse.json({ success: true, schema: updated });
    }

    const updated = await commissionService.updateSchema(session.user.tenantId, schemaId, body);
    return NextResponse.json({ success: true, schema: updated });
  } catch (error: any) {
    console.error('Error updating schema:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar esquema' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const schemaId = params.id;
    await commissionService.deleteSchema(session.user.tenantId, schemaId);
    return NextResponse.json({ success: true, message: 'Esquema eliminado / desactivado' });
  } catch (error: any) {
    console.error('Error deleting schema:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar esquema' }, { status: 500 });
  }
}
