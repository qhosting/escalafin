
// AWS S3 Configuration for File Uploads
import { S3Client } from '@aws-sdk/client-s3';

interface BucketConfig {
  bucketName: string;
  folderPrefix: string;
}

export function getBucketConfig(): BucketConfig {
  return {
    bucketName: process.env.AWS_BUCKET_NAME || 'escalafin-uploads',
    folderPrefix: process.env.AWS_FOLDER_PREFIX || 'escalafin-mvp/',
  };
}

export function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

// Función para validar configuración
export function validateS3Config(): boolean {
  const requiredVars = [
    'AWS_BUCKET_NAME',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];
  
  return requiredVars.every(varName => process.env[varName]);
}
