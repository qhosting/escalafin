
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface WahaConfig {
  id?: string;
  sessionId: string;
  baseUrl: string;
  webhookUrl?: string;
  isActive: boolean;
  apiKeyPreview?: string;
  paymentReceivedTemplate?: string;
  paymentReminderTemplate?: string;
  loanApprovedTemplate?: string;
  loanUpdateTemplate?: string;
  marketingTemplate?: string;
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
  const [config, setConfig] = useState<WahaConfig>({
    sessionId: 'default',
    baseUrl: '',
    webhookUrl: '',
    isActive: true,
    paymentReceivedTemplate: defaultTemplates.paymentReceivedTemplate,
    paymentReminderTemplate: defaultTemplates.paymentReminderTemplate,
    loanApprovedTemplate: defaultTemplates.loanApprovedTemplate,
    loanUpdateTemplate: '',
    marketingTemplate: '',
    n8nWebhookUrl: ''
  });

  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('¡Prueba de conexión desde EscalaFin (Waha)!');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/waha/config');
      const data = await response.json();

      if (response.ok && data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error cargando la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!config.baseUrl) {
        toast.error('Por favor ingresa la URL Base');
        return;
      }

      setSaving(true);

      const payload = {
        ...config,
        apiKey
      };

      const url = '/api/admin/waha/config';
      const method = config.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        await loadConfig();
      } else {
        toast.error(data.error || 'Error guardando la configuración');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error('Error interno del servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      if (!testPhone || !testMessage) {
        toast.error('Por favor ingresa un teléfono y mensaje para la prueba');
        return;
      }

      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/admin/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPhone,
          testMessage
        })
      });

      const data = await response.json();
      setTestResult(data);

      if (response.ok) {
        toast.success('Mensaje de prueba enviado exitosamente');
      } else {
        toast.error(data.error || 'Error en la prueba');
      }
    } catch (error) {
      console.error('Error en la prueba:', error);
      toast.error('Error interno del servidor');
      setTestResult({ error: 'Error interno del servidor' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuración Waha (WhatsApp API)</h1>
          <p className="text-muted-foreground">
            Configura la integración con WhatsApp (Waha) para notificaciones automáticas
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Configuración Básica</TabsTrigger>
          <TabsTrigger value="templates">Plantillas de Mensajes</TabsTrigger>
          <TabsTrigger value="test">Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Instancia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionId">Nombre de Sesión *</Label>
                  <Input
                    id="sessionId"
                    value={config.sessionId}
                    onChange={(e) => setConfig({ ...config, sessionId: e.target.value })}
                    placeholder="default"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">API Key (Opcional)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config.apiKeyPreview || "Ingresa tu API Key si está configurada en Waha"}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="baseUrl">URL Base de Waha *</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://waha.tu-dominio.com"
                />
              </div>

              <div>
                <Label htmlFor="webhookUrl">URL del Webhook (Opcional)</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://tu-servidor.com/api/webhooks/waha"
                />
              </div>

              <div>
                <Label htmlFor="n8nWebhookUrl">URL de Webhook n8n (Opcional)</Label>
                <Input
                  id="n8nWebhookUrl"
                  value={config.n8nWebhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, n8nWebhookUrl: e.target.value })}
                  placeholder="https://n8n.tu-dominio.com/webhook/..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={config.isActive}
                  onCheckedChange={(checked) => setConfig({ ...config, isActive: checked })}
                />
                <Label htmlFor="isActive">Instancia activa</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Puedes usar variables como: {"{{clientName}}"}, {"{{amount}}"}, {"{{loanNumber}}"}, {"{{paymentDate}}"}, etc.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Mensajes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="paymentReceived">Pago Recibido</Label>
                <Textarea
                  id="paymentReceived"
                  rows={6}
                  value={config.paymentReceivedTemplate || ''}
                  onChange={(e) => setConfig({ ...config, paymentReceivedTemplate: e.target.value })}
                  placeholder={defaultTemplates.paymentReceivedTemplate}
                />
              </div>

              <div>
                <Label htmlFor="paymentReminder">Recordatorio de Pago</Label>
                <Textarea
                  id="paymentReminder"
                  rows={6}
                  value={config.paymentReminderTemplate || ''}
                  onChange={(e) => setConfig({ ...config, paymentReminderTemplate: e.target.value })}
                  placeholder={defaultTemplates.paymentReminderTemplate}
                />
              </div>

              <div>
                <Label htmlFor="loanApproved">Préstamo Aprobado</Label>
                <Textarea
                  id="loanApproved"
                  rows={6}
                  value={config.loanApprovedTemplate || ''}
                  onChange={(e) => setConfig({ ...config, loanApprovedTemplate: e.target.value })}
                  placeholder={defaultTemplates.loanApprovedTemplate}
                />
              </div>

              <div>
                <Label htmlFor="marketing">Marketing</Label>
                <Textarea
                  id="marketing"
                  rows={4}
                  value={config.marketingTemplate || ''}
                  onChange={(e) => setConfig({ ...config, marketingTemplate: e.target.value })}
                  placeholder="Plantilla para mensajes de marketing..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prueba de Conexión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Asegúrate de haber guardado la configuración antes de realizar pruebas.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testPhone">Número de Teléfono</Label>
                  <Input
                    id="testPhone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5551234567"
                  />
                </div>
                <div>
                  <Label htmlFor="testMessage">Mensaje de Prueba</Label>
                  <Input
                    id="testMessage"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleTest} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensaje de Prueba
                  </>
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        {testResult.success
                          ? 'Mensaje enviado exitosamente'
                          : `Error: ${testResult.error || testResult.details || 'Desconocido'}`
                        }
                      </p>
                      {testResult.messageId && (
                        <p className="text-sm text-muted-foreground">
                          ID del mensaje: {testResult.messageId}
                        </p>
                      )}
                      {testResult.sessionStatus && (
                        <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                          Status Sesión: {JSON.stringify(testResult.sessionStatus)}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
