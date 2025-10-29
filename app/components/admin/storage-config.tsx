
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
  type: 'local' | 'google-drive'
  local: {
    uploadDir: string
    baseUrl: string
    maxSize: number
  }
  googleDrive: {
    clientId: string
    clientSecret: string
    redirectUri: string
    refreshToken: string
    maxSize: number
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
    googleDrive: {
      clientId: '',
      clientSecret: '',
      redirectUri: 'https://demo.escalafin.com/api/auth/google/callback',
      refreshToken: '',
      maxSize: 10
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

  const updateGoogleDriveSettings = (key: keyof StorageSettings['googleDrive'], value: string | number) => {
    setSettings(prev => ({
      ...prev,
      googleDrive: {
        ...prev.googleDrive,
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
              onValueChange={(value: 'local' | 'google-drive') => 
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
                <SelectItem value="google-drive">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Google Drive
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
              : 'Los archivos se almacenarán en Google Drive. Recomendado para producción y escalabilidad.'
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
          <TabsTrigger value="google-drive" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Google Drive
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

        <TabsContent value="google-drive">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Google Drive</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Para obtener estas credenciales, sigue la{' '}
                <a 
                  href="/GOOGLE_DRIVE_SETUP_GUIDE.md" 
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Guía de Configuración de Google Drive
                </a>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    value={settings.googleDrive.clientId}
                    onChange={(e) => updateGoogleDriveSettings('clientId', e.target.value)}
                    placeholder="123456789.apps.googleusercontent.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    ID de cliente de OAuth 2.0
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={settings.googleDrive.clientSecret}
                    onChange={(e) => updateGoogleDriveSettings('clientSecret', e.target.value)}
                    placeholder="GOCSPX-..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Secreto de cliente de OAuth 2.0
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="redirect-uri">Redirect URI</Label>
                  <Input
                    id="redirect-uri"
                    value={settings.googleDrive.redirectUri}
                    onChange={(e) => updateGoogleDriveSettings('redirectUri', e.target.value)}
                    placeholder="https://demo.escalafin.com/api/auth/google/callback"
                  />
                  <p className="text-sm text-muted-foreground">
                    URI de redirección configurada en Google Cloud
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-token">Refresh Token</Label>
                  <Input
                    id="refresh-token"
                    type="password"
                    value={settings.googleDrive.refreshToken}
                    onChange={(e) => updateGoogleDriveSettings('refreshToken', e.target.value)}
                    placeholder="1//..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Token de actualización obtenido tras autorización
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gdrive-max-size">Tamaño máximo (MB)</Label>
                  <Input
                    id="gdrive-max-size"
                    type="number"
                    value={settings.googleDrive.maxSize}
                    onChange={(e) => updateGoogleDriveSettings('maxSize', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tamaño máximo por archivo
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Estructura de carpetas automática:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>EscalaFin/Sistema: Documentos del sistema</li>
                      <li>EscalaFin/Clientes: Documentos organizados por cliente</li>
                    </ul>
                    <p className="mt-2">
                      La estructura se creará automáticamente al subir el primer archivo.
                    </p>
                  </div>
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
