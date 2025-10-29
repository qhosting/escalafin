
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Edit, 
  Save, 
  X,
  Database,
  Server,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatwootConfigData {
  baseUrl: string;
  websiteToken: string;
  accountId: string;
  apiAccessToken?: string;
  enabled: boolean;
  isConfigured: boolean;
  source?: 'database' | 'environment' | 'none';
}

export function ChatwootConfig() {
  const [config, setConfig] = useState<ChatwootConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    baseUrl: '',
    websiteToken: '',
    accountId: '1',
    apiAccessToken: '',
    enabled: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/chatwoot/config');
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        
        // Inicializar form con datos actuales
        if (data.isConfigured) {
          setFormData({
            baseUrl: data.baseUrl || '',
            websiteToken: data.websiteToken || '',
            accountId: data.accountId || '1',
            apiAccessToken: data.apiAccessToken || '',
            enabled: data.enabled ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching Chatwoot config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validar campos requeridos
      if (!formData.baseUrl || !formData.websiteToken) {
        toast.error('URL Base y Website Token son requeridos');
        return;
      }

      setSaving(true);
      
      const response = await fetch('/api/admin/chatwoot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        setEditing(false);
        await fetchConfig();
      } else {
        toast.error(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving Chatwoot config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/admin/chatwoot/test');
      const data = await response.json();
      
      setTestResult({
        success: data.success,
        message: data.message || data.error || 'Prueba completada',
      });

      if (data.success) {
        toast.success('Conexión exitosa con Chatwoot');
      } else {
        toast.error('Error en la conexión con Chatwoot');
      }
    } catch (error) {
      console.error('Error testing Chatwoot:', error);
      setTestResult({
        success: false,
        message: 'Error al realizar la prueba',
      });
      toast.error('Error al probar conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar la configuración de Chatwoot?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/chatwoot/config', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Configuración eliminada');
        setEditing(false);
        await fetchConfig();
      } else {
        toast.error('Error al eliminar configuración');
      }
    } catch (error) {
      toast.error('Error al eliminar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuración de Chatwoot</CardTitle>
              <CardDescription>
                Sistema de chat en tiempo real para soporte a clientes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {config?.source && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {config.source === 'database' ? (
                    <>
                      <Database className="h-3 w-3" />
                      Base de Datos
                    </>
                  ) : (
                    <>
                      <Server className="h-3 w-3" />
                      Variables de Entorno
                    </>
                  )}
                </Badge>
              )}
              <Badge variant={config?.isConfigured ? 'default' : 'secondary'}>
                {config?.isConfigured ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing || !config?.isConfigured ? (
            <>
              {/* Formulario de edición */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">
                    URL Base <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://app.chatwoot.com"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL de tu instancia de Chatwoot
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteToken">
                    Website Token <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="websiteToken"
                    placeholder="token-del-website"
                    value={formData.websiteToken}
                    onChange={(e) => setFormData({ ...formData, websiteToken: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token del widget de chat (obtenlo en Chatwoot → Inboxes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="1"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    ID de tu cuenta en Chatwoot (generalmente es 1)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiAccessToken">API Access Token (opcional)</Label>
                  <Input
                    id="apiAccessToken"
                    type="password"
                    placeholder="Token de la API"
                    value={formData.apiAccessToken}
                    onChange={(e) => setFormData({ ...formData, apiAccessToken: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Token para acceso a la API (opcional, para funciones avanzadas)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled">Habilitar Chatwoot</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar el widget de chat a los usuarios
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar
                    </>
                  )}
                </Button>
                
                {config?.isConfigured && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        baseUrl: config.baseUrl || '',
                        websiteToken: config.websiteToken || '',
                        accountId: config.accountId || '1',
                        apiAccessToken: config.apiAccessToken || '',
                        enabled: config.enabled ?? true,
                      });
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                )}

                {config?.isConfigured && config.source === 'database' && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Eliminar Configuración
                  </Button>
                )}
              </div>

              {config?.source === 'environment' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La configuración actual proviene de variables de entorno. Al guardar, 
                    se creará una configuración en la base de datos que tendrá prioridad.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              {/* Vista de solo lectura */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL Base</Label>
                  <Input value={config.baseUrl} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Website Token</Label>
                  <Input value={config.websiteToken} readOnly type="password" />
                </div>

                <div className="space-y-2">
                  <Label>Account ID</Label>
                  <Input value={config.accountId} readOnly />
                </div>

                {config.apiAccessToken && (
                  <div className="space-y-2">
                    <Label>API Access Token</Label>
                    <Input value="***" readOnly type="password" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Estado</Label>
                  <Badge variant={config.enabled ? 'default' : 'secondary'}>
                    {config.enabled ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>

                <Button
                  onClick={testConnection}
                  disabled={testing}
                  variant="outline"
                >
                  {testing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Probar Conexión
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              <Alert>
                <AlertDescription>
                  El widget de Chatwoot se muestra automáticamente a los clientes y asesores.
                  Los administradores pueden acceder al panel completo de Chatwoot en:{' '}
                  <a
                    href={config.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    {config.baseUrl}
                  </a>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Widget de chat en tiempo real</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Identificación automática de usuarios</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Historial de conversaciones</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Soporte multicanal (web, móvil)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Etiquetas y atributos personalizados</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guía de Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Obtener credenciales de Chatwoot:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Inicia sesión en tu instancia de Chatwoot</li>
              <li>Ve a <strong>Settings → Inboxes</strong></li>
              <li>Selecciona o crea un nuevo inbox de tipo "Website"</li>
              <li>Copia el <strong>Website Token</strong> desde la configuración del inbox</li>
              <li>El <strong>Account ID</strong> generalmente es 1 (verifica en la URL)</li>
              <li>Para el <strong>API Token</strong>: Settings → Profile Settings → Access Token</li>
            </ol>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Configuración mediante Variables de Entorno:</h4>
            <p className="text-sm text-muted-foreground">
              También puedes configurar Chatwoot usando variables de entorno en EasyPanel:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>CHATWOOT_BASE_URL</code></li>
              <li><code>CHATWOOT_WEBSITE_TOKEN</code></li>
              <li><code>CHATWOOT_ACCOUNT_ID</code></li>
              <li><code>CHATWOOT_API_ACCESS_TOKEN</code> (opcional)</li>
              <li><code>CHATWOOT_ENABLED</code> (true/false)</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Nota: La configuración en base de datos tiene prioridad sobre las variables de entorno.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
