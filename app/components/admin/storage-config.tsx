
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Settings, 
  Save, 
  TestTube,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface StorageSettings {
  type: 'local' | 's3'
  local: {
    uploadDir: string
    baseUrl: string
    maxSize: number
  }
  s3: {
    bucketName: string
    region: string
    folderPrefix: string
    maxSize: number
    accessKeyId: string
    secretAccessKey: string
  }
}

export function StorageConfig() {
  const { data: session } = useSession() || {}
  const [settings, setSettings] = useState<StorageSettings>({
    type: 'local',
    local: {
      uploadDir: '/app/uploads',
      baseUrl: '/api/files/serve',
      maxSize: 10
    },
    s3: {
      bucketName: 'escalafin-uploads',
      region: 'us-east-1',
      folderPrefix: 'escalafin-mvp/',
      maxSize: 10,
      accessKeyId: '',
      secretAccessKey: ''
    }
  })
  
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Solo admins pueden acceder a esta configuración
  if (session?.user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Solo los administradores pueden configurar el almacenamiento de archivos.
          </p>
        </CardContent>
      </Card>
    )
  }

  useEffect(() => {
    loadCurrentSettings()
  }, [])

  const loadCurrentSettings = async () => {
    try {
      const response = await fetch('/api/admin/storage/config')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading storage settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/storage/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Configuración de almacenamiento guardada exitosamente')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al guardar configuración')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResults(null)
      
      const response = await fetch('/api/admin/storage/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: settings.type,
          config: settings[settings.type]
        })
      })

      const result = await response.json()
      setTestResults(result)
      
      if (result.success) {
        toast.success('Prueba de almacenamiento exitosa')
      } else {
        toast.error('Error en prueba de almacenamiento')
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Error al realizar prueba de conectividad'
      })
      toast.error('Error al realizar prueba')
    } finally {
      setTesting(false)
    }
  }

  const updateLocalSettings = (key: keyof StorageSettings['local'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      local: {
        ...prev.local,
        [key]: value
      }
    }))
  }

  const updateS3Settings = (key: keyof StorageSettings['s3'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      s3: {
        ...prev.s3,
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h2 className="text-2xl font-bold">Configuración de Almacenamiento</h2>
          <p className="text-muted-foreground">
            Configure el tipo y opciones de almacenamiento de archivos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Tipo de Almacenamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="storage-type">Tipo de almacenamiento:</Label>
            <Select
              value={settings.type}
              onValueChange={(value: 'local' | 's3') => 
                setSettings(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Almacenamiento Local
                  </div>
                </SelectItem>
                <SelectItem value="s3">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    AWS S3
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant={settings.type === 'local' ? 'default' : 'secondary'}>
              {settings.type === 'local' ? 'Local' : 'Nube'}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {settings.type === 'local' 
              ? 'Los archivos se almacenarán en el servidor local. Ideal para desarrollo o servidores dedicados.'
              : 'Los archivos se almacenarán en AWS S3. Recomendado para producción y escalabilidad.'
            }
          </div>
        </CardContent>
      </Card>

      <Tabs value={settings.type} className="space-y-4">
        <TabsList>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Almacenamiento Local
          </TabsTrigger>
          <TabsTrigger value="s3" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            AWS S3
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upload-dir">Directorio de subida</Label>
                  <Input
                    id="upload-dir"
                    value={settings.local.uploadDir}
                    onChange={(e) => updateLocalSettings('uploadDir', e.target.value)}
                    placeholder="/app/uploads"
                  />
                  <p className="text-sm text-muted-foreground">
                    Ruta completa donde se almacenarán los archivos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base-url">URL base</Label>
                  <Input
                    id="base-url"
                    value={settings.local.baseUrl}
                    onChange={(e) => updateLocalSettings('baseUrl', e.target.value)}
                    placeholder="/api/files/serve"
                  />
                  <p className="text-sm text-muted-foreground">
                    URL para acceder a los archivos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local-max-size">Tamaño máximo (MB)</Label>
                  <Input
                    id="local-max-size"
                    type="number"
                    value={settings.local.maxSize}
                    onChange={(e) => updateLocalSettings('maxSize', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tamaño máximo por archivo en megabytes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="s3">
          <Card>
            <CardHeader>
              <CardTitle>Configuración AWS S3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bucket-name">Nombre del bucket</Label>
                  <Input
                    id="bucket-name"
                    value={settings.s3.bucketName}
                    onChange={(e) => updateS3Settings('bucketName', e.target.value)}
                    placeholder="escalafin-uploads"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <Select
                    value={settings.s3.region}
                    onValueChange={(value) => updateS3Settings('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                      <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder-prefix">Prefijo de carpeta</Label>
                  <Input
                    id="folder-prefix"
                    value={settings.s3.folderPrefix}
                    onChange={(e) => updateS3Settings('folderPrefix', e.target.value)}
                    placeholder="escalafin-mvp/"
                  />
                  <p className="text-sm text-muted-foreground">
                    Prefijo para organizar archivos en el bucket
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="s3-max-size">Tamaño máximo (MB)</Label>
                  <Input
                    id="s3-max-size"
                    type="number"
                    value={settings.s3.maxSize}
                    onChange={(e) => updateS3Settings('maxSize', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access-key">Access Key ID</Label>
                  <Input
                    id="access-key"
                    type="password"
                    value={settings.s3.accessKeyId}
                    onChange={(e) => updateS3Settings('accessKeyId', e.target.value)}
                    placeholder="AKIA..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">Secret Access Key</Label>
                  <Input
                    id="secret-key"
                    type="password"
                    value={settings.s3.secretAccessKey}
                    onChange={(e) => updateS3Settings('secretAccessKey', e.target.value)}
                    placeholder="..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${
              testResults.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {testResults.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">
                  {testResults.success ? 'Prueba exitosa' : 'Error en la prueba'}
                </p>
                <p className="text-sm opacity-90">{testResults.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleTest}
          variant="outline"
          disabled={testing || loading}
        >
          {testing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Probando...
            </div>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Probar conexión
            </>
          )}
        </Button>

        <Button
          onClick={handleSave}
          disabled={testing || loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Guardando...
            </div>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
