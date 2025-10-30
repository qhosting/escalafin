
// API para probar conexión de almacenamiento

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { type, config } = await req.json()

    if (type === 'local') {
      return await testLocalStorage(config)
    } else if (type === 's3') {
      return await testS3Storage(config)
    } else {
      return NextResponse.json(
        { success: false, message: 'Tipo de almacenamiento inválido' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error en prueba de almacenamiento:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno en la prueba de almacenamiento'
    })
  }
}

async function testLocalStorage(config: any) {
  try {
    const uploadDir = config.uploadDir || path.join(process.cwd(), 'uploads')
    
    // Crear directorio si no existe
    await fs.mkdir(uploadDir, { recursive: true })
    
    // Intentar escribir un archivo de prueba
    const testFilePath = path.join(uploadDir, 'test-connection.txt')
    const testContent = 'Test file created at ' + new Date().toISOString()
    
    await fs.writeFile(testFilePath, testContent)
    
    // Leer el archivo para verificar
    const readContent = await fs.readFile(testFilePath, 'utf-8')
    
    // Eliminar archivo de prueba
    await fs.unlink(testFilePath)
    
    if (readContent === testContent) {
      return NextResponse.json({
        success: true,
        message: `Almacenamiento local funcionando correctamente en: ${uploadDir}`
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error al leer/escribir en el almacenamiento local'
      })
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: `Error en almacenamiento local: ${error.message}`
    })
  }
}

async function testS3Storage(config: any) {
  try {
    const s3Client = new S3Client({
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })

    // Probar listando buckets (prueba de credenciales)
    const listCommand = new ListBucketsCommand({})
    const bucketsResult = await s3Client.send(listCommand)
    
    // Verificar que el bucket especificado existe
    const bucketExists = bucketsResult.Buckets?.some(
      bucket => bucket.Name === config.bucketName
    )
    
    if (!bucketExists) {
      return NextResponse.json({
        success: false,
        message: `El bucket '${config.bucketName}' no existe o no es accesible`
      })
    }

    // Intentar subir un archivo de prueba
    const testKey = `${config.folderPrefix || ''}test-connection-${Date.now()}.txt`
    const testContent = 'Test file created at ' + new Date().toISOString()
    
    const putCommand = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    })

    await s3Client.send(putCommand)
    
    // Eliminar archivo de prueba
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: testKey
    })
    
    await s3Client.send(deleteCommand)
    
    return NextResponse.json({
      success: true,
      message: `AWS S3 funcionando correctamente. Bucket: ${config.bucketName}, Región: ${config.region}`
    })

  } catch (error: any) {
    let errorMessage = 'Error desconocido en S3'
    
    if (error.name === 'CredentialsProviderError') {
      errorMessage = 'Credenciales de AWS inválidas o no configuradas'
    } else if (error.name === 'NoSuchBucket') {
      errorMessage = `El bucket '${config.bucketName}' no existe`
    } else if (error.name === 'AccessDenied') {
      errorMessage = 'Acceso denegado. Verifique los permisos del bucket'
    } else {
      errorMessage = error.message || errorMessage
    }

    return NextResponse.json({
      success: false,
      message: `Error en S3: ${errorMessage}`
    })
  }
}
