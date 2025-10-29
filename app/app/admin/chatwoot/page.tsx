import { Metadata } from 'next';
import { ChatwootConfig } from '@/components/admin/chatwoot-config';

export const metadata: Metadata = {
  title: 'Chatwoot - Configuración | EscalaFin',
  description: 'Configuración de Chatwoot para chat en tiempo real',
};

export default function ChatwootConfigPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chatwoot</h1>
        <p className="text-muted-foreground mt-2">
          Configura el sistema de chat en tiempo real para soporte a clientes
        </p>
      </div>
      
      <ChatwootConfig />
    </div>
  );
}
