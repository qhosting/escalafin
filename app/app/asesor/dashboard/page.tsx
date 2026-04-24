'use client';

import { EnhancedAsesorDashboard } from '@/components/dashboards/enhanced-asesor-dashboard';
import { MobileAsesorDashboard } from '@/components/dashboards/mobile-asesor-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useIsMobile } from '@/hooks/use-mobile';

export const dynamic = 'force-dynamic';

export default function AsesorDashboardPage() {
  const isMobile = useIsMobile();

  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      {isMobile ? <MobileAsesorDashboard /> : <EnhancedAsesorDashboard />}
    </AuthWrapper>
  );
}
