
// API para obtener y eliminar archivos individuales

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage-service'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const fileRecord = await prisma.file.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar permisos (admin, advisor, o dueño del archivo/cliente)
    const userRole = session.user.role
    const isOwner = fileRecord.uploadedById === session.user.id
    const isClientFile = fileRecord.clientId === session.user.id
    
    if (!['admin', 'advisor'].includes(userRole) && !isOwner && !isClientFile) {
      return NextResponse.json({ error: 'Sin permisos para ver este archivo' }, { status: 403 })
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
      uploadedBy: fileRecord.uploadedBy,
      client: fileRecord.client
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

    const fileRecord = await prisma.file.findUnique({
      where: { id: params.id }
    })

    if (!fileRecord) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Verificar permisos (solo admin, advisor o dueño del archivo)
    const userRole = session.user.role
    const isOwner = fileRecord.uploadedById === session.user.id
    
    if (!['admin', 'advisor'].includes(userRole) && !isOwner) {
      return NextResponse.json({ error: 'Sin permisos para eliminar este archivo' }, { status: 403 })
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
