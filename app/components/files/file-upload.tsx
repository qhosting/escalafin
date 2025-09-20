
'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  clientId?: string
  category?: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  status: 'uploading' | 'success' | 'error'
  progress?: number
  category?: string
}

export function FileUpload({
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  clientId,
  category = 'general'
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Validate file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    setIsUploading(true)

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      status: 'uploading',
      progress: 0,
      category
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate file upload with progress
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      const actualFile = acceptedFiles[i]

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            )
          )
        }

        // Simulate successful upload
        const uploadedUrl = URL.createObjectURL(actualFile)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success', url: uploadedUrl, progress: 100 }
              : f
          )
        )

        toast.success(`${file.name} subido exitosamente`)
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id ? { ...f, status: 'error' } : f
          )
        )
        toast.error(`Error al subir ${file.name}`)
      }
    }

    setIsUploading(false)
    const successfulUploads = uploadedFiles.filter(f => f.status === 'success')
    onUploadComplete?.(successfulUploads)
  }, [uploadedFiles, maxFiles, category, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: maxSize * 1024 * 1024,
    disabled: isUploading
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('word')) return '📝'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
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
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Suelte los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Arrastre archivos aquí o haga clic para seleccionar
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Máximo {maxFiles} archivos, {maxSize}MB cada uno
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos aceptados: {acceptedTypes.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>{file.name}: {errors.map(e => e.message).join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Archivos ({uploadedFiles.length}/{maxFiles})</h4>
          
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="text-2xl">{getFileIcon(file.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {file.category}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                
                {file.status === 'uploading' && file.progress !== undefined && (
                  <div className="mt-2">
                    <Progress value={file.progress} className="h-1" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {file.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                
                {file.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
