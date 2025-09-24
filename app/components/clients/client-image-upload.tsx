
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, User, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ClientImageUploadProps {
  clientId: string
  currentImageUrl?: string
  onUploadComplete?: (imageUrl: string) => void
  maxSize?: number // in MB
  className?: string
}

interface UploadedImage {
  id: string
  name: string
  size: number
  url: string
  status: 'uploading' | 'success' | 'error'
  progress?: number
}

export function ClientImageUpload({
  clientId,
  currentImageUrl,
  onUploadComplete,
  maxSize = 5,
  className
}: ClientImageUploadProps) {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0] // Solo una imagen
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Imagen muy grande. Máximo ${maxSize}MB`)
      return
    }

    setIsUploading(true)

    const newImage: UploadedImage = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      url: '',
      status: 'uploading',
      progress: 0
    }

    setUploadedImage(newImage)

    // Crear preview local
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'client_profile_photo')
      formData.append('clientId', clientId)
      formData.append('description', `Foto de perfil del cliente ${clientId}`)

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadedImage(prev => 
          prev ? { ...prev, progress: Math.min((prev.progress || 0) + 10, 90) } : prev
        )
      }, 200)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }

      const result = await response.json()
      
      setUploadedImage(prev => prev ? {
        ...prev,
        status: 'success',
        url: result.file.url,
        progress: 100,
        id: result.file.id
      } : null)

      // Limpiar preview local y usar URL del servidor
      URL.revokeObjectURL(localPreview)
      setPreviewUrl(result.file.url)

      toast.success('Imagen de cliente subida exitosamente')
      onUploadComplete?.(result.file.url)

    } catch (error: any) {
      setUploadedImage(prev => prev ? { ...prev, status: 'error' } : null)
      URL.revokeObjectURL(localPreview)
      setPreviewUrl(currentImageUrl || null)
      toast.error(`Error al subir imagen: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }, [clientId, maxSize, onUploadComplete, currentImageUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: maxSize * 1024 * 1024,
    disabled: isUploading,
    multiple: false
  })

  const removeImage = () => {
    if (previewUrl && previewUrl !== currentImageUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setUploadedImage(null)
    setPreviewUrl(currentImageUrl || null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Imagen del Cliente</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sube una foto de perfil del cliente (máximo {maxSize}MB)
        </p>
      </div>

      {/* Preview de imagen actual */}
      {previewUrl && (
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-muted">
            <Image
              src={previewUrl}
              alt="Imagen del cliente"
              fill
              className="object-cover"
              onError={() => {
                setPreviewUrl(null)
                toast.error('Error al cargar la imagen')
              }}
            />
            {!isUploading && uploadedImage?.status !== 'uploading' && (
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {!previewUrl && (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          </div>
        )}

        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Suelte la imagen aquí...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              {previewUrl ? 'Cambiar imagen' : 'Agregar imagen del cliente'}
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Arrastre una imagen aquí o haga clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG, WebP • Máximo {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* Estado de carga */}
      {uploadedImage && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <div className="text-2xl">🖼️</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium truncate">{uploadedImage.name}</p>
              <Badge variant="secondary" className="text-xs">
                cliente_foto
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              {formatFileSize(uploadedImage.size)}
            </p>
            
            {uploadedImage.status === 'uploading' && uploadedImage.progress !== undefined && (
              <div className="mb-2">
                <Progress value={uploadedImage.progress} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  Subiendo... {uploadedImage.progress}%
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {uploadedImage.status === 'uploading' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            {uploadedImage.status === 'success' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {uploadedImage.status === 'error' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
