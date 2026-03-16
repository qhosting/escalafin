
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const generation = await prisma.customReportGeneration.findUnique({
      where: { id: params.id }
    });

    if (!generation || !generation.filePath) {
      return NextResponse.json({ error: 'Archivo de reporte no encontrado' }, { status: 404 });
    }

    // Asegurar que el usuario tiene acceso al reporte
    if (generation.userId !== session.user.id) {
        return NextResponse.json({ error: 'No tienes permiso para descargar este reporte' }, { status: 403 });
    }

    const filePath = path.resolve(generation.filePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'El archivo físico no existe en el servidor' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading custom report:', error);
    return NextResponse.json(
      { error: 'Error al descargar el archivo' },
      { status: 500 }
    );
  }
}
