
// API para servir archivos locales

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getStorageConfig } from '@/lib/storage-config'
import { prisma } from '@/lib/prisma'
import { fileAccessWhere } from '@/lib/file-access'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const config = getStorageConfig()
    
    // Solo servir archivos si el almacenamiento es local
    if (config.type !== 'local') {
      return NextResponse.json(
        { error: 'Esta API solo funciona con almacenamiento local' },
        { status: 404 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const filePath = params.path.join('/')
    const root = await fs.realpath(config.local!.uploadDir)
    const fullPath = await fs.realpath(path.resolve(root, filePath)).catch(() => null)
    if (!fullPath || !fullPath.startsWith(root + path.sep)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar que el archivo existe en la base de datos
    const fileRecord = await prisma.file.findFirst({
      where: { AND: [{ filePath }, fileAccessWhere(session.user)] },
      include: {
        client: {
          select: {
            asesorId: true
          }
        }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar que el archivo existe físicamente
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 })
    }

    // Leer y servir el archivo
    const fileBuffer = await fs.readFile(fullPath)
    const headers = new Headers()
    
    headers.set('Content-Type', fileRecord.mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set('Cache-Control', 'private, no-store')
    
    // Si es una imagen, permitir mostrar inline, otros archivos como attachment
    const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileRecord.mimeType)
    headers.set('X-Content-Type-Options', 'nosniff')
    const disposition = isImage ? 'inline' : 'attachment'
    headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(fileRecord.originalName)}`)

    return new NextResponse(new Uint8Array(fileBuffer), { headers })

  } catch (error) {
    console.error('Error al servir archivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
