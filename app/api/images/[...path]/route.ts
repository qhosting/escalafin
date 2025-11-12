
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { downloadFile, getStorageInfo } from '@/lib/unified-storage';

/**
 * GET /api/images/[...path]
 * Sirve imágenes del sistema de almacenamiento
 * Requiere autenticación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Reconstruir la ruta completa
    const filePath = params.path.join('/');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Ruta de archivo no especificada' },
        { status: 400 }
      );
    }

    // Obtener el tipo de almacenamiento
    const storageType = getStorageInfo().type;

    // Descargar el archivo
    const buffer = await downloadFile(filePath, storageType);

    if (!buffer) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    // Determinar el tipo MIME basado en la extensión
    const extension = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    // Devolver la imagen con los headers apropiados
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Error en GET /api/images/[...path]:', error);
    return NextResponse.json(
      { error: 'Error al cargar la imagen', details: error.message },
      { status: 500 }
    );
  }
}
