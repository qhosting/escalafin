
'use client';

import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </AuthWrapper>
  );
}
