

// API para servir archivos almacenados localmente
// Ruta dinámica que maneja /api/files/categoria/archivo.jpg

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar autenticación
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Construir la ruta del archivo
    const filePath = params.path.join('/')
    const defaultUploadDir = path.join(process.cwd(), 'uploads')
    const fullPath = path.join(process.env.LOCAL_UPLOAD_DIR || defaultUploadDir, filePath)
    
    // Verificar que el archivo existe y está dentro del directorio permitido
    const uploadDir = path.resolve(process.env.LOCAL_UPLOAD_DIR || defaultUploadDir)
    const resolvedPath = path.resolve(fullPath)
    
    if (!resolvedPath.startsWith(uploadDir)) {
      return new NextResponse('Acceso denegado', { status: 403 })
    }

    try {
      const fileBuffer = await fs.readFile(resolvedPath)
      
      // Determinar tipo de contenido basado en extensión
      const ext = path.extname(resolvedPath).toLowerCase()
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
      
      const contentType = contentTypeMap[ext] || 'application/octet-stream'
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Content-Disposition': `inline; filename="${path.basename(resolvedPath)}"`
        }
      })
      
    } catch (fileError) {
      console.error('Error al leer archivo:', fileError)
      return new NextResponse('Archivo no encontrado', { status: 404 })
    }

  } catch (error) {
    console.error('Error en API files:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}
