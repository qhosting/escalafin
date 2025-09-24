
import { Metadata } from 'next'
import { FileManager } from '@/components/files/file-manager'

export const metadata: Metadata = {
  title: 'Gestión de Archivos | EscalaFin',
  description: 'Administre todos los archivos del sistema',
}

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <FileManager allowUpload={true} />
    </div>
  )
}
