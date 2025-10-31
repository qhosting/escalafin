
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Send,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface LabsMobileSettings {
  username: string;
  apiToken: string;
  sender: string;
  enabled: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  credits?: number;
}

export function LabsMobileConfig() {
  const [settings, setSettings] = useState<LabsMobileSettings>({
    username: '',
    apiToken: '',
    sender: 'EscalaFin',
    enabled: false
  });
  
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings?category=labsmobile');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            username: data.settings.username || '',
            apiToken: data.settings.apiToken || '',
            sender: data.settings.sender || 'EscalaFin',
            enabled: data.settings.enabled || false
          });
          
          if (data.settings.enabled) {
            checkCredits();
          }
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/admin/settings/labsmobile/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error consultando créditos:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'labsmobile',
          settings
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      toast.success('Configuración guardada exitosamente');
      
      if (settings.enabled) {
        checkCredits();
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!testPhone) {
      toast.error('Por favor ingresa un número de teléfono');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/settings/labsmobile/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          settings
        })
      });

      const data = await response.json();
      
      setTestResult({
        success: data.success,
        message: data.message,
        credits: data.credits
      });

      if (data.success) {
        toast.success('SMS de prueba enviado exitosamente');
        if (data.credits !== undefined) {
          setCredits(data.credits);
        }
      } else {
        toast.error(data.message || 'Error al enviar SMS de prueba');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error al probar conexión con LabsMobile'
      });
      toast.error('Error al probar la conexión');
    } finally {
      setTestLoading(false);
    }
  };

  const isConfigured = settings.username && settings.apiToken;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Configuración de LabsMobile SMS</h2>
        <p className="text-muted-foreground">
          Configura el servicio de envío de SMS para notificaciones (Límite: 160 caracteres por mensaje)
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div className="flex items-center gap-2 mt-1">
                  {settings.enabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">Activo</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-600">Inactivo</span>
                    </>
                  )}
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Créditos</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">
                    {credits !== null ? credits.toFixed(2) : '--'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkCredits}
                    disabled={!isConfigured}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Límite por SMS</p>
                <p className="text-2xl font-bold mt-1">160</p>
                <p className="text-xs text-muted-foreground">caracteres</p>
              </div>
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="test">Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Credenciales de LabsMobile</CardTitle>
              <CardDescription>
                Ingresa tus credenciales de LabsMobile. Obtén tu API Token desde tu panel de LabsMobile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para obtener tus credenciales:
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Accede a tu cuenta en <a href="https://www.labsmobile.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">labsmobile.com</a></li>
                    <li>Ve a <strong>API</strong> → <strong>Configuración</strong></li>
                    <li>Copia tu <strong>Username</strong> y <strong>API Token</strong></li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="tu-usuario"
                    value={settings.username}
                    onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    placeholder="tu-api-token"
                    value={settings.apiToken}
                    onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender">Remitente (Sender ID)</Label>
                  <Input
                    id="sender"
                    type="text"
                    placeholder="EscalaFin"
                    maxLength={11}
                    value={settings.sender}
                    onChange={(e) => setSettings({ ...settings, sender: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo 11 caracteres. Este nombre aparecerá como remitente del SMS.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Habilitar envío de SMS
                  </Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={loading || !isConfigured}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Envío de SMS</CardTitle>
              <CardDescription>
                Envía un SMS de prueba para verificar que la configuración sea correcta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConfigured ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Primero debes configurar tus credenciales de LabsMobile en la pestaña de Configuración.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="testPhone">Número de teléfono</Label>
                    <Input
                      id="testPhone"
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa un número con código de país (ej: +52 para México)
                    </p>
                  </div>

                  <Button 
                    onClick={testConnection} 
                    disabled={testLoading || !testPhone}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {testLoading ? 'Enviando...' : 'Enviar SMS de Prueba'}
                  </Button>

                  {testResult && (
                    <Alert variant={testResult.success ? 'default' : 'destructive'}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {testResult.message}
                        {testResult.credits !== undefined && (
                          <p className="mt-2">Créditos restantes: {testResult.credits.toFixed(2)}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
