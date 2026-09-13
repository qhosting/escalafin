
// API para obtener y eliminar archivos individuales

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage-service'
import { prisma } from '@/lib/prisma'
import { fileAccessWhere } from '@/lib/file-access'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const fileRecord = await prisma.file.findFirst({
      where: { AND: [{ id: params.id }, fileAccessWhere(session.user)] },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            tenantId: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            tenantId: true
          }
        }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Generar URL de acceso
    const accessUrl = await storageService.getFileUrl(fileRecord.filePath)

    return NextResponse.json({
      id: fileRecord.id,
      fileName: fileRecord.fileName,
      originalName: fileRecord.originalName,
      size: fileRecord.fileSize,
      mimeType: fileRecord.mimeType,
      category: fileRecord.category,
      description: fileRecord.description,
      url: accessUrl,
      uploadedAt: fileRecord.createdAt,
      storageType: fileRecord.storageType,
      uploadedBy: {
        id: fileRecord.uploadedBy.id,
        firstName: fileRecord.uploadedBy.firstName,
        lastName: fileRecord.uploadedBy.lastName,
        email: fileRecord.uploadedBy.email
      },
      client: fileRecord.client
        ? {
            id: fileRecord.client.id,
            firstName: fileRecord.client.firstName,
            lastName: fileRecord.client.lastName
          }
        : null
    })

  } catch (error) {
    console.error('Error al obtener archivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const fileRecord = await prisma.file.findFirst({
      where: { AND: [{ id: params.id }, fileAccessWhere(session.user, 'delete')] },
      include: {
        uploadedBy: { select: { tenantId: true } },
        client: { select: { tenantId: true } }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Eliminar archivo del almacenamiento
    await storageService.deleteFile(fileRecord.filePath)

    // Eliminar registro de la base de datos
    await prisma.file.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Archivo eliminado exitosamente' })

  } catch (error) {
    console.error('Error al eliminar archivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
