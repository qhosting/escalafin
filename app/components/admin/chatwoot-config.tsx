
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ChatwootConfigData {
  baseUrl: string;
  accountId: string;
  isConfigured: boolean;
}

export function ChatwootConfig() {
  const [config, setConfig] = useState<ChatwootConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
      }
    } catch (error) {
      console.error('Error fetching Chatwoot config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
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
            <Badge variant={config?.isConfigured ? 'default' : 'secondary'}>
              {config?.isConfigured ? 'Configurado' : 'No configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.isConfigured ? (
            <>
              <div className="space-y-2">
                <Label>URL Base</Label>
                <Input value={config.baseUrl} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Account ID</Label>
                <Input value={config.accountId} readOnly />
              </div>

              <div className="flex items-center gap-2">
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
          ) : (
            <Alert>
              <AlertDescription>
                Chatwoot no está configurado. Por favor, configure las variables de entorno:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>CHATWOOT_BASE_URL</li>
                  <li>CHATWOOT_WEBSITE_TOKEN</li>
                  <li>CHATWOOT_ACCOUNT_ID</li>
                  <li>CHATWOOT_API_ACCESS_TOKEN (opcional)</li>
                </ul>
              </AlertDescription>
            </Alert>
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
    </div>
  );
}
