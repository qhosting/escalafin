
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getStorageConfig } from '@/lib/storage-config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const config = getStorageConfig();
    
    // Solo servir archivos si estamos usando almacenamiento local
    if (config.type !== 'local') {
      return NextResponse.json(
        { error: 'Almacenamiento local no habilitado' },
        { status: 400 }
      );
    }

    const filePath = params.path.join('/');
    const fullPath = path.join(config.local!.uploadDir, filePath);

    // Validar que el path no intente acceder fuera del directorio de uploads
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(config.local!.uploadDir)) {
      return NextResponse.json(
        { error: 'Path no válido' },
        { status: 400 }
      );
    }

    // Verificar que el archivo existe
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = await fs.readFile(fullPath);
    
    // Determinar content type basado en extensión
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Error al servir el archivo' },
      { status: 500 }
    );
  }
}
