'use client';

import { EnhancedClientDashboard } from '@/components/dashboards/enhanced-client-dashboard';
import { MobileClientDashboard } from '@/components/dashboards/mobile-client-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useIsMobile } from '@/hooks/use-mobile';

export const dynamic = 'force-dynamic';

export default function ClientDashboardPage() {
  const isMobile = useIsMobile();

  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      {isMobile ? <MobileClientDashboard /> : <EnhancedClientDashboard />}
    </AuthWrapper>
  );
}
