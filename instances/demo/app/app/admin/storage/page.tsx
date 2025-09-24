
import { Metadata } from 'next'
import { StorageConfig } from '@/components/admin/storage-config'

export const metadata: Metadata = {
  title: 'Configuración de Almacenamiento | EscalaFin',
  description: 'Configure el sistema de almacenamiento de archivos (Local/S3)',
}

export default function StoragePage() {
  return <StorageConfig />
}
