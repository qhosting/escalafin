
'use client';

import { ClienteDashboard } from '@/components/dashboards/cliente-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClienteDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE', 'ADMIN']}>
      <ClienteDashboard />
    </AuthWrapper>
  );
}
