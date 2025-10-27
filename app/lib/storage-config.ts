
// Configuración unificada de almacenamiento de archivos
// Soporta almacenamiento local y AWS S3

export type StorageType = 'local' | 's3'

export interface StorageConfig {
  type: StorageType
  local?: {
    uploadDir: string
    baseUrl: string
    maxSize: number // MB
  }
  s3?: {
    bucketName: string
    region: string
    folderPrefix: string
    maxSize: number // MB
  }
}

export function getStorageConfig(): StorageConfig {
  // Auto-detectar si AWS está configurado correctamente
  const hasAwsCredentials = !!(
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_BUCKET_NAME &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID !== 'tu-access-key' &&
    process.env.AWS_SECRET_ACCESS_KEY !== 'tu-secret-key'
  )
  
  // Usar S3 solo si está explícitamente configurado Y tiene credenciales válidas
  const storageType = (process.env.STORAGE_TYPE === 's3' && hasAwsCredentials) 
    ? 's3' 
    : 'local'
  
  return {
    type: storageType,
    local: {
      uploadDir: process.env.LOCAL_UPLOAD_DIR || '/app/uploads',
      baseUrl: process.env.LOCAL_BASE_URL || '/api/files',
      maxSize: parseInt(process.env.LOCAL_MAX_FILE_SIZE || '10')
    },
    s3: {
      bucketName: process.env.AWS_BUCKET_NAME || 'escalafin-uploads',
      region: process.env.AWS_REGION || 'us-east-1',
      folderPrefix: process.env.AWS_FOLDER_PREFIX || 'escalafin-mvp/',
      maxSize: parseInt(process.env.S3_MAX_FILE_SIZE || '10')
    }
  }
}

export function validateStorageConfig(): { valid: boolean; errors: string[] } {
  const config = getStorageConfig()
  const errors: string[] = []

  if (config.type === 's3') {
    const requiredS3Vars = [
      'AWS_BUCKET_NAME',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ]
    
    requiredS3Vars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Variable de entorno requerida para S3: ${varName}`)
      }
    })
  } else if (config.type === 'local') {
    if (!config.local?.uploadDir) {
      errors.push('Directorio de uploads local no configurado')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
