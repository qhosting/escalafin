
import { Metadata } from 'next';
import { MessageTemplatesManagement } from '@/components/admin/message-templates-management';

export const metadata: Metadata = {
  title: 'Plantillas de Mensajes | EscalaFin',
  description: 'Gestión de plantillas para SMS, WhatsApp y otros canales',
};

export default function MessageTemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Plantillas de Mensajes</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona plantillas para SMS (LabMobile), WhatsApp y otros canales de comunicación
        </p>
      </div>

      <MessageTemplatesManagement />
    </div>
  );
}
