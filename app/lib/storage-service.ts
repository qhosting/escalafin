
// Servicio unificado de almacenamiento de archivos
// Abstrae el almacenamiento local y S3

import { promises as fs } from 'fs'
import path from 'path'
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getStorageConfig, StorageType } from './storage-config'

export interface FileMetadata {
  originalName: string
  fileName: string
  size: number
  mimeType: string
  category?: string
  clientId?: string
  uploadedAt: Date
}

export interface StoredFile {
  id: string
  path: string
  url: string
  metadata: FileMetadata
}

class StorageService {
  private config = getStorageConfig()
  private s3Client?: S3Client

  constructor() {
    if (this.config.type === 's3') {
      this.s3Client = new S3Client({
        region: this.config.s3?.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      })
    }
  }

  async uploadFile(
    buffer: Buffer, 
    originalName: string, 
    mimeType: string,
    category?: string,
    clientId?: string
  ): Promise<StoredFile> {
    const timestamp = Date.now()
    const fileExtension = path.extname(originalName)
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`
    
    const metadata: FileMetadata = {
      originalName,
      fileName,
      size: buffer.length,
      mimeType,
      category,
      clientId,
      uploadedAt: new Date()
    }

    if (this.config.type === 'local') {
      return this.uploadToLocal(buffer, fileName, metadata)
    } else {
      return this.uploadToS3(buffer, fileName, metadata)
    }
  }

  private async uploadToLocal(
    buffer: Buffer, 
    fileName: string, 
    metadata: FileMetadata
  ): Promise<StoredFile> {
    const uploadDir = this.config.local!.uploadDir
    const categoryDir = metadata.category || 'general'
    const fullDir = path.join(uploadDir, categoryDir)
    
    // Crear directorio si no existe
    await fs.mkdir(fullDir, { recursive: true })
    
    const filePath = path.join(fullDir, fileName)
    await fs.writeFile(filePath, buffer)
    
    const relativePath = path.join(categoryDir, fileName)
    const url = `${this.config.local!.baseUrl}/${relativePath}`
    
    return {
      id: fileName,
      path: relativePath,
      url,
      metadata
    }
  }

  private async uploadToS3(
    buffer: Buffer, 
    fileName: string, 
    metadata: FileMetadata
  ): Promise<StoredFile> {
    if (!this.s3Client) {
      throw new Error('S3 Client no configurado')
    }

    const categoryPrefix = metadata.category || 'general'
    const key = `${this.config.s3!.folderPrefix}${categoryPrefix}/${fileName}`
    
    const command = new PutObjectCommand({
      Bucket: this.config.s3!.bucketName,
      Key: key,
      Body: buffer,
      ContentType: metadata.mimeType,
      Metadata: {
        originalName: metadata.originalName,
        category: metadata.category || '',
        clientId: metadata.clientId || '',
        uploadedAt: metadata.uploadedAt.toISOString()
      }
    })

    await this.s3Client.send(command)
    
    // Para S3, la URL se genera dinámicamente al acceder
    return {
      id: key,
      path: key,
      url: key, // Se reemplazará con URL firmada al acceder
      metadata
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    if (this.config.type === 'local') {
      return `${this.config.local!.baseUrl}/${filePath}`
    } else {
      return this.generateS3SignedUrl(filePath)
    }
  }

  private async generateS3SignedUrl(key: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 Client no configurado')
    }

    const command = new GetObjectCommand({
      Bucket: this.config.s3!.bucketName,
      Key: key,
    })

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.config.type === 'local') {
      const fullPath = path.join(this.config.local!.uploadDir, filePath)
      await fs.unlink(fullPath).catch(() => {
        // Ignore if file doesn't exist
      })
    } else {
      await this.deleteFromS3(filePath)
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 Client no configurado')
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.s3!.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)
  }

  async listFiles(category?: string, clientId?: string): Promise<StoredFile[]> {
    // Esta función requerirá una implementación más compleja
    // Por ahora, retorna un array vacío
    // En un sistema completo, esto consultaría la base de datos
    return []
  }

  getStorageType(): StorageType {
    return this.config.type
  }

  getMaxFileSize(): number {
    return this.config.type === 'local' 
      ? this.config.local!.maxSize 
      : this.config.s3!.maxSize
  }
}

export const storageService = new StorageService()
