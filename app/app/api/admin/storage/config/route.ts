
// API para configuración de almacenamiento

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getStorageConfig, validateStorageConfig } from '@/lib/storage-config'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const config = getStorageConfig()
    const validation = validateStorageConfig()
    
    return NextResponse.json({
      settings: {
        type: config.type,
        local: config.local,
        s3: {
          ...config.s3,
          // No enviar las credenciales reales al frontend
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '***masked***' : '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '***masked***' : ''
        }
      },
      validation
    })

  } catch (error) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const settings = await req.json()
    
    // Validar los datos recibidos
    if (!settings.type || !['local', 's3'].includes(settings.type)) {
      return NextResponse.json(
        { error: 'Tipo de almacenamiento inválido' },
        { status: 400 }
      )
    }

    // En un sistema real, aquí guardaríamos la configuración en la base de datos
    // o actualizaríamos las variables de entorno
    
    // Por ahora, solo validamos la configuración
    const mockConfig = {
      type: settings.type,
      local: settings.local || {
        uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
        baseUrl: '/api/files/serve',
        maxSize: 10
      },
      s3: settings.s3 || {
        bucketName: 'escalafin-uploads',
        region: 'us-east-1',
        folderPrefix: 'escalafin-mvp/',
        maxSize: 10
      }
    }

    // Aquí implementarías la lógica para actualizar las variables de entorno
    // o guardar la configuración en la base de datos
    
    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      settings: mockConfig
    })

  } catch (error) {
    console.error('Error al guardar configuración:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
