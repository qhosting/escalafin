
'use client';

import { AsesorDashboard } from '@/components/dashboards/asesor-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR', 'ADMIN']}>
      <AsesorDashboard />
    </AuthWrapper>
  );
}
