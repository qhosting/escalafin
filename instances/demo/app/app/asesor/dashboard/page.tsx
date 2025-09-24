
'use client';

import { EnhancedAsesorDashboard } from '@/components/dashboards/enhanced-asesor-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <EnhancedAsesorDashboard />
    </AuthWrapper>
  );
}
