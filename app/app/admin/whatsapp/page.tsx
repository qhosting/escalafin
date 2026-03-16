
'use client';

import { useState } from 'react';
import WhatsAppConversations from '@/components/whatsapp/whatsapp-conversations';
import ChatbotRuleManager from '@/components/whatsapp/chatbot-rule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Bot, Settings, LayoutDashboard } from 'lucide-react';

export default function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState('conversations');

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Estado de Conexión</h3>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">WAHA: Conectado</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Instancia: default (Evolution API)</p>
            </div>
            {/* Otros estados de configuración */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
