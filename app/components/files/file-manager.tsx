
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Grid,
  List,
  Eye,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { FileUpload, type UploadedFile } from './file-upload'
import { cn } from '@/lib/utils'

interface FileRecord {
  id: string
  fileName: string
  originalName: string
  size: number
  mimeType: string
  category: string
  description?: string
  url: string
  uploadedAt: string
  storageType: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface FileManagerProps {
  clientId?: string
  category?: string
  allowUpload?: boolean
  compact?: boolean
}

export function FileManager({ 
  clientId, 
  category, 
  allowUpload = true, 
  compact = false 
}: FileManagerProps) {
  const { data: session } = useSession() || {}
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(category || 'all')
  const [showUpload, setShowUpload] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{
    type: string
    maxFileSize: number
  } | null>(null)

  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'identification', label: 'Identificación' },
    { value: 'income_proof', label: 'Comprobante de ingresos' },
    { value: 'address_proof', label: 'Comprobante de domicilio' },
    { value: 'contracts', label: 'Contratos' },
    { value: 'payments', label: 'Comprobantes de pago' },
    { value: 'reports', label: 'Reportes' },
    { value: 'general', label: 'General' }
  ]

  useEffect(() => {
    loadFiles()
  }, [clientId, categoryFilter])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (clientId) params.append('clientId', clientId)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      
      const response = await fetch(`/api/files/list?${params}`)
      const data = await response.json()
      
      if (data.files) {
        setFiles(data.files)
        setStorageInfo(data.storageInfo)
      }
    } catch (error) {
      toast.error('Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = (uploadedFiles: UploadedFile[]) => {
    toast.success(`${uploadedFiles.length} archivo(s) subido(s) exitosamente`)
    setShowUpload(false)
    loadFiles()
  }

  const handleDownload = (file: FileRecord) => {
    // Crear un enlace temporal para descargar
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.originalName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este archivo?')) {
      return
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Archivo eliminado exitosamente')
        loadFiles()
      } else {
        toast.error('Error al eliminar archivo')
      }
    } catch (error) {
      toast.error('Error al eliminar archivo')
    }
  }

  const handleView = (file: FileRecord) => {
    window.open(file.url, '_blank')
  }

  const getFileIcon = (mimeType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const iconSize = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8'
    }[size]

    if (mimeType.startsWith('image/')) {
      return <Image className={iconSize} />
    }
    if (mimeType.includes('pdf')) {
      return <FileText className={cn(iconSize, 'text-red-500')} />
    }
    if (mimeType.includes('word')) {
      return <FileText className={cn(iconSize, 'text-blue-500')} />
    }
    return <File className={iconSize} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredFiles = files.filter(file => 
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (compact) {
    return (
      <div className="space-y-4">
        {allowUpload && (
          <div className="flex gap-2">
            <Button onClick={() => setShowUpload(!showUpload)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Subir archivo
            </Button>
          </div>
        )}

        {showUpload && (
          <FileUpload
            onUploadComplete={handleUploadComplete}
            clientId={clientId}
            category={category}
            maxFiles={3}
            maxSize={storageInfo?.maxFileSize || 10}
          />
        )}

        <div className="space-y-2">
          {filteredFiles.slice(0, 5).map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 border rounded">
              {getFileIcon(file.mimeType, 'sm')}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleView(file)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredFiles.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            Y {filteredFiles.length - 5} archivos más...
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Archivos</h2>
          <p className="text-muted-foreground">
            Almacenamiento: {storageInfo?.type?.toUpperCase()} | 
            Máximo: {storageInfo?.maxFileSize}MB por archivo
          </p>
        </div>
        
        {allowUpload && (
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            Subir archivos
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Subir archivos</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              clientId={clientId}
              category={category}
              maxSize={storageInfo?.maxFileSize || 10}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-2 text-muted-foreground">Cargando archivos...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-8">
          <File className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">No se encontraron archivos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(file.mimeType, 'lg')}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleView(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      {(session?.user?.role === 'admin' || 
                        file.uploadedBy.id === session?.user?.id) && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(file.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-sm truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {file.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {file.storageType.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(file.uploadedAt)}
                  </p>
                  {file.client && (
                    <p className="text-xs text-muted-foreground">
                      Cliente: {file.client.firstName} {file.client.lastName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(file.mimeType)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{file.originalName}</p>
                      <Badge variant="outline" className="text-xs">
                        {file.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {file.storageType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                      <span>Por: {file.uploadedBy.name}</span>
                      {file.client && (
                        <span>Cliente: {file.client.firstName} {file.client.lastName}</span>
                      )}
                    </div>
                    {file.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {file.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(file)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {(session?.user?.role === 'admin' || 
                      file.uploadedBy.id === session?.user?.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
