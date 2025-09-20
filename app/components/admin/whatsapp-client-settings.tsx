
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MessageSquare, Bell, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsappNotificationsEnabled: boolean;
  whatsappPaymentReceived: boolean;
  whatsappPaymentReminder: boolean;
  whatsappLoanUpdates: boolean;
  whatsappMarketingMessages: boolean;
}

interface WhatsAppClientSettingsProps {
  clientId?: string;
}

export default function WhatsAppClientSettings({ clientId }: WhatsAppClientSettingsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (clientId) {
      loadClientSettings(clientId);
    } else {
      loadClients();
    }
  }, [clientId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      if (response.ok) {
        setClients(data.clients || []);
      } else {
        toast.error('Error cargando clientes');
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.error('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadClientSettings = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${id}/whatsapp-settings`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedClient(data.client);
      } else {
        toast.error('Error cargando configuraciones del cliente');
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      toast.error('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleSettingChange = (key: keyof Client, value: boolean) => {
    if (selectedClient) {
      setSelectedClient({
        ...selectedClient,
        [key]: value
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedClient) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/clients/${selectedClient.id}/whatsapp-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNotificationsEnabled: selectedClient.whatsappNotificationsEnabled,
          whatsappPaymentReceived: selectedClient.whatsappPaymentReceived,
          whatsappPaymentReminder: selectedClient.whatsappPaymentReminder,
          whatsappLoanUpdates: selectedClient.whatsappLoanUpdates,
          whatsappMarketingMessages: selectedClient.whatsappMarketingMessages
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Configuraciones actualizadas exitosamente');
        // Actualizar la lista de clientes si estamos viendo todos
        if (!clientId) {
          setClients(prev => prev.map(c => 
            c.id === selectedClient.id ? { ...c, ...data.client } : c
          ));
        }
      } else {
        toast.error(data.error || 'Error actualizando configuraciones');
      }
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      toast.error('Error interno del servidor');
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Configuraciones WhatsApp de Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona las configuraciones de notificaciones WhatsApp por cliente
          </p>
        </div>
        {selectedClient && (
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        {!clientId && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Clientes
                </CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedClient?.id === client.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge 
                            variant={client.whatsappNotificationsEnabled ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {client.whatsappNotificationsEnabled ? 'Habilitado' : 'Deshabilitado'}
                          </Badge>
                          {client.whatsappNotificationsEnabled && (
                            <div className="flex gap-1">
                              {client.whatsappPaymentReceived && (
                                <div className="w-2 h-2 rounded-full bg-green-500" title="Pagos recibidos" />
                              )}
                              {client.whatsappPaymentReminder && (
                                <div className="w-2 h-2 rounded-full bg-blue-500" title="Recordatorios" />
                              )}
                              {client.whatsappLoanUpdates && (
                                <div className="w-2 h-2 rounded-full bg-yellow-500" title="Actualizaciones" />
                              )}
                              {client.whatsappMarketingMessages && (
                                <div className="w-2 h-2 rounded-full bg-purple-500" title="Marketing" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuraciones del Cliente Seleccionado */}
        <div className={clientId ? 'col-span-1' : 'lg:col-span-2'}>
          {selectedClient ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuraciones para {selectedClient.firstName} {selectedClient.lastName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Teléfono: {selectedClient.phone}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Switch Principal */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/25">
                  <div>
                    <Label htmlFor="main-notifications" className="text-base font-medium">
                      Notificaciones WhatsApp
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar/deshabilitar todas las notificaciones WhatsApp
                    </p>
                  </div>
                  <Switch
                    id="main-notifications"
                    checked={selectedClient.whatsappNotificationsEnabled}
                    onCheckedChange={(checked) => handleSettingChange('whatsappNotificationsEnabled', checked)}
                  />
                </div>

                {/* Configuraciones Específicas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Tipos de Notificaciones</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <div>
                          <Label className="font-medium">Pagos Recibidos</Label>
                          <p className="text-xs text-muted-foreground">
                            Notificar cuando se reciba un pago
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selectedClient.whatsappPaymentReceived}
                        onCheckedChange={(checked) => handleSettingChange('whatsappPaymentReceived', checked)}
                        disabled={!selectedClient.whatsappNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <div>
                          <Label className="font-medium">Recordatorios de Pago</Label>
                          <p className="text-xs text-muted-foreground">
                            Recordatorios de pagos próximos a vencer
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selectedClient.whatsappPaymentReminder}
                        onCheckedChange={(checked) => handleSettingChange('whatsappPaymentReminder', checked)}
                        disabled={!selectedClient.whatsappNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-yellow-600" />
                        <div>
                          <Label className="font-medium">Actualizaciones de Préstamos</Label>
                          <p className="text-xs text-muted-foreground">
                            Aprobaciones, rechazos y cambios en préstamos
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selectedClient.whatsappLoanUpdates}
                        onCheckedChange={(checked) => handleSettingChange('whatsappLoanUpdates', checked)}
                        disabled={!selectedClient.whatsappNotificationsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <div>
                          <Label className="font-medium">Mensajes de Marketing</Label>
                          <p className="text-xs text-muted-foreground">
                            Promociones y mensajes comerciales
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selectedClient.whatsappMarketingMessages}
                        onCheckedChange={(checked) => handleSettingChange('whatsappMarketingMessages', checked)}
                        disabled={!selectedClient.whatsappNotificationsEnabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de Configuraciones */}
                <div className="p-4 bg-muted/25 rounded-lg">
                  <h4 className="font-medium mb-2">Resumen de Configuraciones</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Estado general:</span>
                      <Badge variant={selectedClient.whatsappNotificationsEnabled ? "default" : "secondary"}>
                        {selectedClient.whatsappNotificationsEnabled ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    {selectedClient.whatsappNotificationsEnabled && (
                      <>
                        <div className="flex justify-between">
                          <span>Pagos recibidos:</span>
                          <span>{selectedClient.whatsappPaymentReceived ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recordatorios:</span>
                          <span>{selectedClient.whatsappPaymentReminder ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Actualizaciones:</span>
                          <span>{selectedClient.whatsappLoanUpdates ? '✓' : '✗'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Marketing:</span>
                          <span>{selectedClient.whatsappMarketingMessages ? '✓' : '✗'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <div className="text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4" />
                <p>Selecciona un cliente para ver sus configuraciones</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
