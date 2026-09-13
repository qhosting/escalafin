import { FileManager } from '@/components/files/file-manager';
export default function DocumentsPage() {
  return <section className="space-y-6"><h1 className="text-2xl font-semibold">Mis documentos</h1><FileManager allowUpload /></section>;
}
