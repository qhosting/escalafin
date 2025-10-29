
import { Metadata } from 'next';
import { ChatwootConfig } from '@/components/admin/chatwoot-config';

export const metadata: Metadata = {
  title: 'Chatwoot - EscalaFin',
  description: 'Configuración de chat en tiempo real',
};

export default function ChatwootPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Chatwoot</h2>
      </div>
      <ChatwootConfig />
    </div>
  );
}
