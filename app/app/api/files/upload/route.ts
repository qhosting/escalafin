
// API para upload de archivos con soporte dual (local/S3)

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage-service'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'general'
    const clientId = formData.get('clientId') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No se encontró archivo' }, { status: 400 })
    }

    // Validaciones
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Archivo muy grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido' 
      }, { status: 400 })
    }

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Subir archivo usando el servicio de almacenamiento
    const storedFile = await storageService.uploadFile(
      buffer,
      file.name,
      file.type,
      category,
      clientId
    )

    // Guardar metadata en base de datos
    const fileRecord = await prisma.file.create({
      data: {
        fileName: storedFile.metadata.fileName,
        originalName: storedFile.metadata.originalName,
        filePath: storedFile.path,
        fileSize: storedFile.metadata.size,
        mimeType: storedFile.metadata.mimeType,
        category: category,
        description: description,
        clientId: clientId || null,
        uploadedById: session.user.id,
        storageType: storageService.getStorageType()
      }
    })

    // Generar URL de acceso
    const accessUrl = await storageService.getFileUrl(storedFile.path)

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        originalName: fileRecord.originalName,
        size: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        category: fileRecord.category,
        description: fileRecord.description,
        url: accessUrl,
        uploadedAt: fileRecord.createdAt,
        storageType: fileRecord.storageType
      }
    })

  } catch (error) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
