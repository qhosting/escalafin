

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
  Info,
  User,
  Key,
  Palette,
  CreditCard,
  Phone
} from 'lucide-react';
// Build fix forced update v3
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { IntegrationsSettings } from '@/components/admin/integrations-settings';
import { BrandingSettings } from '@/components/admin/branding-settings';
import { SubscriptionSettings } from '@/components/admin/subscription-settings';
import WahaConfig from '@/components/admin/waha-config';
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
  support_spei: {
    bank: string;
    holder: string;
    clabe: string;
    instructions: string;
  };
  support_contact: {
    email: string;
    whatsapp: string;
    whatsappDisplay: string;
    workingHours: string;
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
  const [planName, setPlanName] = useState<string>('');
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: 'EscalaFin',
      siteDescription: 'Sistema de Gestión de Créditos y Préstamos',
      supportEmail: 'soporte@escalafin.com',
      timezone: 'America/Mexico_City',
      currency: 'MXN',
      language: 'es'
    },
    support_spei: {
      bank: 'BANCO',
      holder: 'NOMBRE DEL TITULAR',
      clabe: '000000000000000000',
      instructions: '1. Utiliza los datos SPEI proporcionados\n2. Incluye tu número de cliente en el concepto\n3. Envía el comprobante por WhatsApp\n4. Espera la confirmación de recarga'
    },
    support_contact: {
      email: 'soporte@escalafin.com',
      whatsapp: '+525512345678',
      whatsappDisplay: '+52 55 1234 5678',
      workingHours: 'Lunes a Viernes: 9:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM'
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
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await fetch('/api/admin/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        if (data.plan?.displayName) {
          setPlanName(data.plan.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

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
      <AuthWrapper allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <div className="flex items-center justify-center min-h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-8 h-8" />
                Configuración del Sistema
              </h1>
              {planName && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold px-3 py-1 rounded-full border-none">
                  Plan {planName}
                </Badge>
              )}
            </div>
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

        <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-72 shrink-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-[2rem] p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-indigo-500/5">
            <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-1.5 items-stretch">
              
              <div className="px-4 py-3 mt-2 first:mt-0 text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em]">Configuración Base</div>
              <TabsTrigger value="general" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Info className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">General</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Palette className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <CreditCard className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Suscripción</span>
              </TabsTrigger>

              <div className="px-4 py-3 mt-4 text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em]">Comunicación</div>
              <TabsTrigger value="notifications" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Bell className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger value="my-notifications" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <User className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Mis Preferencias</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle group-data-[state=active]:scale-110 transition-transform"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                <span className="font-bold text-sm">WhatsApp API</span>
              </TabsTrigger>

              <div className="px-4 py-3 mt-4 text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em]">Seguridad & Sistema</div>
              <TabsTrigger value="security" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Shield className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Server className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Sistema</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Key className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Integraciones</span>
              </TabsTrigger>

              <div className="px-4 py-3 mt-4 text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em]">Finanzas & Soporte</div>
              <TabsTrigger value="spei" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <CreditCard className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Recargas SPEI</span>
              </TabsTrigger>
              <TabsTrigger value="soporte" className="flex items-center justify-start gap-3 px-4 py-3 rounded-2xl transition-all duration-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group">
                <Phone className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="font-bold text-sm">Contacto Soporte</span>
              </TabsTrigger>
            </TabsList>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full animate-in fade-in slide-in-from-right-4 duration-500">

          <TabsContent value="billing">
            <SubscriptionSettings />
          </TabsContent>

          {/* WhatsApp API Settings */}
          <TabsContent value="whatsapp">
            <WahaConfig />
          </TabsContent>


          {/* SPEI Settings */}
          <TabsContent value="spei">
            <Card>
              <CardHeader>
                <CardTitle>Datos para Recargas SPEI</CardTitle>
                <CardDescription>
                  Configura los datos bancarios que verán los clientes para realizar transferencias.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="spei_bank">Banco</Label>
                    <Input
                      id="spei_bank"
                      value={settings.support_spei?.bank || ''}
                      onChange={(e) => updateSetting('support_spei', 'bank', e.target.value)}
                      placeholder="Ej. KLAR, BBVA, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spei_holder">Titular de la Cuenta</Label>
                    <Input
                      id="spei_holder"
                      value={settings.support_spei?.holder || ''}
                      onChange={(e) => updateSetting('support_spei', 'holder', e.target.value)}
                      placeholder="Nombre completo del titular"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="spei_clabe">CLABE Interbancaria (18 dígitos)</Label>
                    <Input
                      id="spei_clabe"
                      value={settings.support_spei?.clabe || ''}
                      onChange={(e) => updateSetting('support_spei', 'clabe', e.target.value)}
                      placeholder="000 000 0000 0000 0000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="spei_instructions">Instrucciones de Pago</Label>
                    <textarea
                      id="spei_instructions"
                      rows={5}
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={settings.support_spei?.instructions || ''}
                      onChange={(e) => updateSetting('support_spei', 'instructions', e.target.value)}
                      placeholder="Instrucciones paso a paso..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa saltos de línea para separar los pasos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Contact Settings */}
          <TabsContent value="soporte">
            <Card>
              <CardHeader>
                <CardTitle>Contacto de Soporte Técnico</CardTitle>
                <CardDescription>
                  Configura los medios de contacto que verán los usuarios en la página de soporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="support_email">Email de Soporte</Label>
                    <Input
                      id="support_email"
                      value={settings.support_contact?.email || ''}
                      onChange={(e) => updateSetting('support_contact', 'email', e.target.value)}
                      placeholder="soporte@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support_whatsapp">WhatsApp (Link numérico)</Label>
                    <Input
                      id="support_whatsapp"
                      value={settings.support_contact?.whatsapp || ''}
                      onChange={(e) => updateSetting('support_contact', 'whatsapp', e.target.value)}
                      placeholder="525512345678 (Sin símbolos)"
                    />
                    <p className="text-[10px] text-muted-foreground">Usado para generar enlaces directos wa.me/</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support_whatsapp_display">WhatsApp (Visual)</Label>
                    <Input
                      id="support_whatsapp_display"
                      value={settings.support_contact?.whatsappDisplay || ''}
                      onChange={(e) => updateSetting('support_contact', 'whatsappDisplay', e.target.value)}
                      placeholder="+52 55 1234 5678"
                    />
                    <p className="text-[10px] text-muted-foreground">Como se muestra en la pantalla al usuario</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="support_working_hours">Horarios de Atención</Label>
                    <textarea
                      id="support_working_hours"
                      rows={3}
                      className="w-full p-2 border rounded-md font-mono text-sm"
                      value={settings.support_contact?.workingHours || ''}
                      onChange={(e) => updateSetting('support_contact', 'workingHours', e.target.value)}
                      placeholder="Lunes a Viernes: ..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <IntegrationsSettings />
          </TabsContent>

          {/* My Notifications Settings */}
          <TabsContent value="my-notifications">
            <NotificationSettings />
          </TabsContent>


          {/* Branding Settings */}
          <TabsContent value="branding">
            <BrandingSettings />
          </TabsContent>

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
                    <Label className="text-indigo-600 font-bold">Plan de Suscripción</Label>
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-md">
                      <CreditCard className="h-4 w-4 text-indigo-500" />
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                        {planName || 'Cargando plan...'}
                      </span>
                    </div>
                  </div>

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
          </div>
        </Tabs>
      </div>
    </AuthWrapper >
  );
}
