
'use client'

import React, { useState } from 'react'
import { FileUpload, type UploadedFile } from './file-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  Filter,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  name: string
  category: string
  type: string
  size: number
  uploadedAt: Date
  url: string
  clientId?: string
  uploadedBy: string
}

interface DocumentManagerProps {
  clientId?: string
  documents?: Document[]
  onDocumentsChange?: (documents: Document[]) => void
}

const documentCategories = [
  { value: 'identification', label: 'Identificación' },
  { value: 'income', label: 'Comprobantes de Ingresos' },
  { value: 'address', label: 'Comprobante de Domicilio' },
  { value: 'banking', label: 'Estados Bancarios' },
  { value: 'references', label: 'Referencias' },
  { value: 'contracts', label: 'Contratos' },
  { value: 'other', label: 'Otros' },
]

export function DocumentManager({ 
  clientId, 
  documents = [], 
  onDocumentsChange 
}: DocumentManagerProps) {
  const [filteredDocs, setFilteredDocs] = useState<Document[]>(documents)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  // Filter documents based on search and category
  React.useEffect(() => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter)
    }

    setFilteredDocs(filtered)
  }, [documents, searchTerm, categoryFilter])

  const handleUploadComplete = (files: UploadedFile[]) => {
    const newDocuments: Document[] = files.map(file => ({
      id: file.id,
      name: file.name,
      category: file.category || 'other',
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      url: file.url,
      clientId,
      uploadedBy: 'Usuario Actual' // En producción vendría de la sesión
    }))

    const updatedDocuments = [...documents, ...newDocuments]
    onDocumentsChange?.(updatedDocuments)
    setIsUploadOpen(false)
    toast.success(`${files.length} documento(s) agregado(s)`)
  }

  const downloadDocument = (doc: Document) => {
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.name
    link.click()
    toast.success(`Descargando ${doc.name}`)
  }

  const viewDocument = (doc: Document) => {
    window.open(doc.url, '_blank')
  }

  const deleteDocument = (docId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== docId)
    onDocumentsChange?.(updatedDocuments)
    toast.success('Documento eliminado')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryLabel = (category: string) => {
    const cat = documentCategories.find(c => c.value === category)
    return cat?.label || 'Otros'
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('word')) return '📝'
    return '📎'
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {documentCategories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Subir Documentos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subir Documentos</DialogTitle>
              <DialogDescription>
                Agregue documentos del cliente para completar su expediente
              </DialogDescription>
            </DialogHeader>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
              maxSize={10}
              clientId={clientId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-sm text-muted-foreground">Total Documentos</div>
        </div>
        {documentCategories.slice(0, 3).map(category => {
          const count = documents.filter(doc => doc.category === category.value).length
          return (
            <div key={category.value} className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground">{category.label}</div>
            </div>
          )
        })}
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
          <p className="text-muted-foreground mb-4">
            {documents.length === 0 
              ? 'Aún no se han subido documentos para este cliente'
              : 'No se encontraron documentos con los filtros aplicados'
            }
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Primer Documento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="text-3xl">{getFileIcon(doc.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{doc.name}</h4>
                  <Badge variant="secondary">
                    {getCategoryLabel(doc.category)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatFileSize(doc.size)}</span>
                  <span>•</span>
                  <span>{doc.uploadedAt.toLocaleDateString('es-ES')}</span>
                  <span>•</span>
                  <span>Por {doc.uploadedBy}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewDocument(doc)}
                  title="Ver documento"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                  title="Descargar documento"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDocument(doc.id)}
                  title="Eliminar documento"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
