

'use client';

import { useState, useEffect } from 'react';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Mail, 
  Bell, 
  Shield, 
  Server,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    timezone: string;
    currency: string;
    language: string;
  };
  notifications: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    pushNotifications: boolean;
    reminderDays: number;
    overdueNotifications: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordExpiration: number;
    twoFactorAuth: boolean;
    auditLogging: boolean;
  };
  system: {
    maintenanceMode: boolean;
    debugMode: boolean;
    autoBackup: boolean;
    backupFrequency: string;
    maxFileSize: number;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'EscalaFin',
      siteDescription: 'Sistema de Gestión de Créditos y Préstamos',
      supportEmail: 'soporte@escalafin.com',
      timezone: 'America/Mexico_City',
      currency: 'MXN',
      language: 'es'
    },
    notifications: {
      emailEnabled: true,
      whatsappEnabled: true,
      smsEnabled: false,
      pushNotifications: true,
      reminderDays: 3,
      overdueNotifications: true
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordExpiration: 90,
      twoFactorAuth: false,
      auditLogging: true
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      autoBackup: true,
      backupFrequency: 'daily',
      maxFileSize: 50
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Error al guardar configuración');

      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <AuthWrapper allowedRoles={['ADMIN']}>
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Configuración del Sistema
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Administra los ajustes avanzados y parámetros del sistema
            </p>
          </div>
          
          <Button onClick={saveSettings} disabled={saving} size="lg">
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Información básica del sistema y configuraciones regionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nombre del Sitio</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Email de Soporte</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <select
                      id="timezone"
                      className="w-full p-2 border rounded-md"
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    >
                      <option value="America/Mexico_City">México Central</option>
                      <option value="America/Tijuana">México Pacífico</option>
                      <option value="America/Cancun">México Este</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <select
                      id="currency"
                      className="w-full p-2 border rounded-md"
                      value={settings.general.currency}
                      onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                    >
                      <option value="MXN">Peso Mexicano (MXN)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                  <textarea
                    id="siteDescription"
                    rows={3}
                    className="w-full p-2 border rounded-md resize-none"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Controla los canales de notificación y recordatorios del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por Email</Label>
                        <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
                      </div>
                      <Switch
                        checked={settings.notifications.emailEnabled}
                        onCheckedChange={(checked) => updateSetting('notifications', 'emailEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones WhatsApp</Label>
                        <p className="text-sm text-gray-500">Enviar recordatorios por WhatsApp</p>
                      </div>
                      <Switch
                        checked={settings.notifications.whatsappEnabled}
                        onCheckedChange={(checked) => updateSetting('notifications', 'whatsappEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones SMS</Label>
                        <p className="text-sm text-gray-500">Enviar mensajes de texto SMS</p>
                      </div>
                      <Switch
                        checked={settings.notifications.smsEnabled}
                        onCheckedChange={(checked) => updateSetting('notifications', 'smsEnabled', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminderDays">Días de Recordatorio</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.notifications.reminderDays}
                        onChange={(e) => updateSetting('notifications', 'reminderDays', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-gray-500">Días antes del vencimiento para enviar recordatorio</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones de Vencidos</Label>
                        <p className="text-sm text-gray-500">Notificar pagos vencidos automáticamente</p>
                      </div>
                      <Switch
                        checked={settings.notifications.overdueNotifications}
                        onCheckedChange={(checked) => updateSetting('notifications', 'overdueNotifications', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>
                  Controles de acceso, sesiones y política de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="480"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Máximos Intentos de Login</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiration">Expiración de Contraseña (días)</Label>
                      <Input
                        id="passwordExpiration"
                        type="number"
                        min="30"
                        max="365"
                        value={settings.security.passwordExpiration}
                        onChange={(e) => updateSetting('security', 'passwordExpiration', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Autenticación de Dos Factores</Label>
                        <p className="text-sm text-gray-500">Requerir 2FA para administradores</p>
                      </div>
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Registro de Auditoría</Label>
                        <p className="text-sm text-gray-500">Registrar todas las acciones del sistema</p>
                      </div>
                      <Switch
                        checked={settings.security.auditLogging}
                        onCheckedChange={(checked) => updateSetting('security', 'auditLogging', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>
                  Mantenimiento, copias de seguridad y configuraciones técnicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modo de Mantenimiento</Label>
                        <p className="text-sm text-gray-500">Deshabilitar acceso temporal al sistema</p>
                      </div>
                      <Switch
                        checked={settings.system.maintenanceMode}
                        onCheckedChange={(checked) => updateSetting('system', 'maintenanceMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Modo de Depuración</Label>
                        <p className="text-sm text-gray-500">Mostrar información detallada de errores</p>
                      </div>
                      <Switch
                        checked={settings.system.debugMode}
                        onCheckedChange={(checked) => updateSetting('system', 'debugMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Respaldo Automático</Label>
                        <p className="text-sm text-gray-500">Crear respaldos automáticos de la base de datos</p>
                      </div>
                      <Switch
                        checked={settings.system.autoBackup}
                        onCheckedChange={(checked) => updateSetting('system', 'autoBackup', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Frecuencia de Respaldo</Label>
                      <select
                        id="backupFrequency"
                        className="w-full p-2 border rounded-md"
                        value={settings.system.backupFrequency}
                        onChange={(e) => updateSetting('system', 'backupFrequency', e.target.value)}
                      >
                        <option value="hourly">Cada hora</option>
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Tamaño Máximo de Archivo (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        min="1"
                        max="500"
                        value={settings.system.maxFileSize}
                        onChange={(e) => updateSetting('system', 'maxFileSize', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Configuraciones Críticas
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Los cambios en el modo de mantenimiento y depuración afectan la disponibilidad del sistema. 
                        Úselos solo cuando sea necesario.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthWrapper>
  );
}
