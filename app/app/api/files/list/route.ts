
// API para listar archivos con filtros

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { storageService } from '@/lib/storage-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros basados en rol del usuario
    const userRole = session.user.role
    let whereClause: any = {}

    if (userRole === 'CLIENTE') {
      // Los clientes solo ven sus propios archivos
      whereClause.clientId = session.user.id
    } else if (userRole === 'ASESOR') {
      // Los asesores ven archivos de sus clientes asignados
      whereClause.OR = [
        { uploadedById: session.user.id },
        { 
          client: {
            asesorId: session.user.id
          }
        }
      ]
    }
    // Los admins ven todos los archivos (sin filtro adicional)

    // Aplicar filtros adicionales
    if (clientId) {
      whereClause.clientId = clientId
    }
    if (category) {
      whereClause.category = category
    }

    // Obtener archivos con paginación
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.file.count({ where: whereClause })
    ])

    // Generar URLs de acceso para cada archivo
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const accessUrl = await storageService.getFileUrl(file.filePath)
        return {
          id: file.id,
          fileName: file.fileName,
          originalName: file.originalName,
          size: file.fileSize,
          mimeType: file.mimeType,
          category: file.category,
          description: file.description,
          url: accessUrl,
          uploadedAt: file.createdAt,
          storageType: file.storageType,
          uploadedBy: file.uploadedBy,
          client: file.client
        }
      })
    )

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      files: filesWithUrls,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      storageInfo: {
        type: storageService.getStorageType(),
        maxFileSize: storageService.getMaxFileSize()
      }
    })

  } catch (error) {
    console.error('Error al listar archivos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
