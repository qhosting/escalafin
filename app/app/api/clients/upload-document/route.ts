import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;
    const clientId = formData.get('clientId') as string | null || 'temp-client';

    if (!file) {
      return NextResponse.json({ error: 'Archivo no proporcionado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = path.extname(file.name) || '.jpg';
    const fileName = `${clientId}_${documentType || 'doc'}_${Date.now()}${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/documents/${fileName}`;

    // TODO: Google Drive Sync API Hook (preparado cuando GOOGLE_DRIVE_ENABLED=true)
    const googleDriveSync = {
      enabled: process.env.GOOGLE_DRIVE_ENABLED === 'true',
      driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
      status: process.env.GOOGLE_DRIVE_ENABLED === 'true' ? 'SYNCED' : 'NOT_CONFIGURED',
    };

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      documentType,
      googleDriveSync,
    });
  } catch (error: any) {
    console.error('Error al subir documento:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar el documento' },
      { status: 500 }
    );
  }
}
