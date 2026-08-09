'use client';

import WhatsAppMessagesDashboard from '@/components/admin/whatsapp-messages-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export default function WhatsAppMessagesPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <WhatsAppMessagesDashboard />
    </AuthWrapper>
  );
}
