'use client';

import WhatsAppClientSettings from '@/components/admin/whatsapp-client-settings';
import { AuthWrapper } from '@/components/auth-wrapper';

export default function WhatsAppClientsPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <WhatsAppClientSettings />
    </AuthWrapper>
  );
}
