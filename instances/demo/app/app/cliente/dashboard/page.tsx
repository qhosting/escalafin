
'use client';

import { EnhancedClientDashboard } from '@/components/dashboards/enhanced-client-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClientDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <EnhancedClientDashboard />
    </AuthWrapper>
  );
}
