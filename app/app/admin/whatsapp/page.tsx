
'use client';

import { useState, useEffect } from 'react';
import WhatsAppConversations from '@/components/whatsapp/whatsapp-conversations';
import ChatbotRuleManager from '@/components/whatsapp/chatbot-rule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bot, Settings, LayoutDashboard, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/admin/waha/status');
      const data = await res.json();
      if (data.success) {
        setConnectionStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Comunicaciones</h1>
          <p className="text-muted-foreground">
            Gestione las conversaciones por WhatsApp y automatizaciones del chatbot.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversaciones
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="gap-2">
            <Bot className="h-4 w-4" />
            Chatbot & Reglas
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <WhatsAppConversations />
        </TabsContent>

        <TabsContent value="chatbot" className="space-y-4">
          <ChatbotRuleManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold">Estado de WhatsApp</h3>
                <Button variant="ghost" size="icon" onClick={fetchStatus} disabled={isLoadingStatus}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado Instancia:</span>
                  <Badge className={connectionStatus?.status === 'WORKING' ? 'bg-green-500' : 'bg-amber-500'}>
                    {connectionStatus?.status || 'DESCONOCIDO'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sesión:</span>
                  <span className="text-sm font-medium">{connectionStatus?.name || 'default'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Motor:</span>
                  <span className="text-sm font-medium">WAHA (WEBJS)</span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-6 border-t pt-2">
                ID de Instancia: {connectionStatus?.id || 'N/A'}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Configuración de Webhooks</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Mensajes Entrantes: Activo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Confirmaciones (ACK): Activo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Estados de Sesión: Activo</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 text-xs" size="sm">
                Probar Webhook
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
