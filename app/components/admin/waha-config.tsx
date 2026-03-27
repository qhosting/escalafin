
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  QrCode, 
  RefreshCw, 
  LogOut, 
  MessageSquare,
  Settings,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface WahaSessionStatus {
  status: 'STARTING' | 'SCAN_QR' | 'WORKING' | 'STOPPED' | 'FAILED';
  qrCode?: string;
  me?: {
    id: string;
    pushName: string;
  };
  details?: string;
}

interface WahaTemplates {
  id?: string;
  paymentReceivedTemplate?: string;
  paymentReminderTemplate?: string;
  loanApprovedTemplate?: string;
  n8nWebhookUrl?: string;
}

const defaultTemplates = {
  paymentReceivedTemplate: `🎉 *¡Pago recibido exitosamente!*

Hola {{clientName}},

Hemos recibido tu pago de {{amount}} para el préstamo #{{loanNumber}}.

📅 *Fecha de pago:* {{paymentDate}}
💰 *Monto:* {{amount}}
📄 *Préstamo:* #{{loanNumber}}

¡Gracias por tu puntualidad!

*EscalaFin - Tu aliado financiero*`,

  paymentReminderTemplate: `🔔 *Recordatorio de pago*

Hola {{clientName}},

{{#isOverdue}}
Tu pago de {{amount}} para el préstamo #{{loanNumber}} venció hace {{daysOverdue}} día(s).
{{/isOverdue}}
{{^isOverdue}}
Tu pago de {{amount}} para el préstamo #{{loanNumber}} vence el {{dueDate}}.
{{/isOverdue}}

💰 *Monto:* {{amount}}
📄 *Préstamo:* #{{loanNumber}}

*EscalaFin - Tu aliado financiero*`,

  loanApprovedTemplate: `✅ *¡Préstamo aprobado!*

¡Felicidades {{clientName}}!

Tu solicitud de préstamo ha sido aprobada.

💰 *Monto aprobado:* {{amount}}
📄 *Número de préstamo:* #{{loanNumber}}
💳 *Pago mensual:* {{monthlyPayment}}
📅 *Plazo:* {{termMonths}} meses

*EscalaFin - Tu aliado financiero*`
};

export default function WahaConfig() {
  const [session, setSession] = useState<WahaSessionStatus | null>(null);
  const [templates, setTemplates] = useState<WahaTemplates>({
    paymentReceivedTemplate: defaultTemplates.paymentReceivedTemplate,
    paymentReminderTemplate: defaultTemplates.paymentReminderTemplate,
    loanApprovedTemplate: defaultTemplates.loanApprovedTemplate,
    n8nWebhookUrl: ''
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    startPolling();
    return () => stopPolling();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSessionStatus(), fetchTemplates()]);
    } catch (error) {
      console.error('Error loading WAHA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStatus = async () => {
    try {
      const response = await fetch('/api/admin/waha/session');
      const data = await response.json();
      if (response.ok) {
        setSession(data.status);
      }
    } catch (error) {
      console.error('Error fetching WAHA session:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/waha/config');
      const data = await response.json();
      if (response.ok && data.config) {
        setTemplates(prev => ({
          ...prev,
          ...data.config,
          // Mantener los valores por defecto si los del servidor son nulos o vacíos
          paymentReceivedTemplate: data.config.paymentReceivedTemplate || prev.paymentReceivedTemplate,
          paymentReminderTemplate: data.config.paymentReminderTemplate || prev.paymentReminderTemplate,
          loanApprovedTemplate: data.config.loanApprovedTemplate || prev.loanApprovedTemplate,
        }));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) return;
    pollInterval.current = setInterval(fetchSessionStatus, 5000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const handleAction = async (action: 'start' | 'logout') => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/waha/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast.success(action === 'start' ? 'Iniciando sesión...' : 'Cerrando sesión...');
        setTimeout(fetchSessionStatus, 2000);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error en la acción');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  const saveTemplates = async () => {
    try {
      setSavingTemplates(true);
      const response = await fetch('/api/admin/waha/config', {
        method: templates.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates)
      });

      if (response.ok) {
        toast.success('Plantillas guardadas');
        fetchTemplates();
      } else {
        toast.error('Error al guardar plantillas');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testPhone) {
      toast.error('Ingresa un número de teléfono');
      return;
    }

    try {
      setTesting(true);
      const response = await fetch('/api/admin/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPhone,
          testMessage: 'Prueba de conexión desde EscalaFin 🚀'
        })
      });

      if (response.ok) {
        toast.success('Mensaje enviado');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Fallo el envío');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setTesting(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-muted-foreground font-medium">Sincronizando con WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-2xl">
            <Smartphone className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">WhatsApp Business</h1>
            <p className="text-muted-foreground font-medium">Gestiona tu comunicación directa con clientes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {session?.status === 'WORKING' ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-1.5 rounded-full border-green-200 font-bold flex items-center gap-2 animate-pulse">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              CONECTADO
            </Badge>
          ) : session?.status === 'SCAN_QR' ? (
            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 px-4 py-1.5 rounded-full font-bold flex items-center gap-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full animate-ping" />
              ESPERANDO VINCULACIÓN
            </Badge>
          ) : (
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-bold">
              DESCONECTADO
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="bg-gray-100 p-1.5 rounded-2xl h-14 md:w-fit grid grid-cols-2 md:inline-flex border-none shadow-inner">
          <TabsTrigger value="connection" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <QrCode className="h-4 w-4 mr-2" />
            Conexión
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ── Estado y QR ── */}
            <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 overflow-hidden">
              <CardHeader className="bg-gray-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Vinculación de Dispositivo
                </CardTitle>
                <CardDescription>Escanea el código para activar las notificaciones automáticas</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 pb-10 flex flex-col items-center justify-center min-h-[400px]">
                {session?.status === 'SCAN_QR' && session.qrCode ? (
                  <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="p-6 bg-white rounded-3xl shadow-xl ring-1 ring-gray-100 relative group transition-all">
                       <img 
                        src={session.qrCode} 
                        alt="WhatsApp QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl pointer-events-none">
                         <div className="p-3 bg-white/90 backdrop-blur rounded-full shadow-lg">
                           <RefreshCw className="h-6 w-6 text-blue-600 animate-spin-slow" />
                         </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="font-black text-xl text-gray-900 leading-tight">1. Abre WhatsApp en tu celular</p>
                      <p className="text-gray-500 font-medium">Ve a Menú o Configuración &gt; Dispositivos vinculados</p>
                    </div>
                  </div>
                ) : session?.status === 'WORKING' ? (
                  <div className="text-center space-y-6 animate-in fade-in scale-95 duration-500">
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                        <div className="relative z-10 w-full h-full bg-green-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-gray-900 uppercase">¡WhatsApp Activo!</h3>
                      <p className="text-muted-foreground font-medium">Vinculado como: <span className="text-blue-600 font-bold">{session.me?.pushName || 'Dispositivo Principal'}</span></p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction('logout')}
                      disabled={actionLoading}
                      className="rounded-2xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 px-6 font-bold transition-all"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión actual
                    </Button>
                  </div>
                ) : session?.status === 'STARTING' ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <p className="font-bold text-gray-600">Iniciando motor de mensajería...</p>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="p-6 bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto grayscale opacity-50">
                        <Smartphone className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">Sin conexión activa</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto">Activa el motor para generar un código de vinculación.</p>
                    </div>
                    <Button 
                      onClick={() => handleAction('start')} 
                      disabled={actionLoading}
                      className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-black text-lg transition-all"
                    >
                      {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Instancia"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Seguridad e Info ── */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-none shadow-sm bg-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <ShieldCheck className="h-32 w-32" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Conexión Segura</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-8">
                  <p className="text-blue-100 font-medium leading-relaxed">
                    EscalaFin utiliza cifrado de extremo a extremo a través de la API oficial para asegurar que tus mensajes y contactos estén protegidos.
                  </p>
                  <ul className="space-y-3 text-sm font-bold">
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-300" /> Envío de comprobantes automático
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-300" /> Recordatorios de pago dinámicos
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-300" /> Soporte multimarca para cada tenant
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {session?.status === 'WORKING' && (
                <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      Prueba Rápida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-500 tracking-wider ml-1">Número Destinatario</Label>
                      <Input 
                        placeholder="Ej: 525512345678" 
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        className="rounded-xl h-12 bg-gray-50 border-gray-100 focus:ring-blue-500 font-bold"
                      />
                    </div>
                    <Button 
                      onClick={handleTestMessage}
                      disabled={testing}
                      className="w-full rounded-2xl h-12 font-black transition-all hover:scale-[1.02]"
                    >
                      {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Enviar Prueba
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 outline-none">
          <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Plantillas de Notificación
                </CardTitle>
                <CardDescription>Personaliza los mensajes automáticos que reciben tus clientes</CardDescription>
              </div>
              <Button onClick={saveTemplates} disabled={savingTemplates} className="rounded-2xl h-10 px-6 font-black shadow-lg shadow-blue-50">
                {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-black text-gray-700 uppercase tracking-tighter text-xs">Pago Recibido</Label>
                    <Badge variant="secondary" className="text-[10px] rounded-full">Automatico</Badge>
                  </div>
                  <Textarea 
                    value={templates.paymentReceivedTemplate}
                    onChange={(e) => setTemplates({...templates, paymentReceivedTemplate: e.target.value})}
                    rows={8}
                    className="rounded-2xl bg-gray-50 border-gray-100 focus:border-blue-500 p-4 transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-black text-gray-700 uppercase tracking-tighter text-xs">Recordatorio (Vencimiento)</Label>
                    <Badge variant="secondary" className="text-[10px] rounded-full">Automatico</Badge>
                  </div>
                  <Textarea 
                    value={templates.paymentReminderTemplate}
                    onChange={(e) => setTemplates({...templates, paymentReminderTemplate: e.target.value})}
                    rows={8}
                    className="rounded-2xl bg-gray-50 border-gray-100 focus:border-blue-500 p-4 transition-all leading-relaxed"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-black text-gray-700 uppercase tracking-tighter text-xs">Aprobación de Crédito</Label>
                    <Badge variant="secondary" className="text-[10px] rounded-full">Al crear préstamo</Badge>
                  </div>
                  <Textarea 
                    value={templates.loanApprovedTemplate}
                    onChange={(e) => setTemplates({...templates, loanApprovedTemplate: e.target.value})}
                    rows={6}
                    className="rounded-2xl bg-gray-50 border-gray-100 focus:border-blue-500 p-4 transition-all leading-relaxed"
                  />
                </div>
              </div>

              <Separator className="my-6 bg-gray-100" />

              <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Integración de Flujos Avanzados</h4>
                    <p className="text-xs text-muted-foreground font-medium">Conecta los eventos a herramientas externas como n8n</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Webhook Webhook n8n (Opcional)</Label>
                  <Input 
                    value={templates.n8nWebhookUrl || ''}
                    onChange={(e) => setTemplates({...templates, n8nWebhookUrl: e.target.value})}
                    placeholder="https://n8n.tu-instancia.com/webhook/..."
                    className="rounded-xl h-12 bg-white border-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="h-10" />
    </div>
  );
}
