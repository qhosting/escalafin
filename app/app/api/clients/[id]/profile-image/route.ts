import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const clientId = params.id;
    const tenantId = (session as any).user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'clients');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `client_${clientId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/clients/${fileName}`;

    // Update client profile image in DB
    const client = await tenantPrisma.client.update({
      where: { id: clientId },
      data: { profileImage: relativeUrl },
      select: { id: true, profileImage: true, firstName: true, lastName: true },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error('Error uploading client profile image:', error);
    return NextResponse.json({ error: error.message || 'Error al subir la imagen' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const clientId = params.id;
    const tenantId = (session as any).user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const client = await tenantPrisma.client.update({
      where: { id: clientId },
      data: { profileImage: null },
      select: { id: true, profileImage: true },
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error('Error removing client profile image:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar la imagen' }, { status: 500 });
  }
}
