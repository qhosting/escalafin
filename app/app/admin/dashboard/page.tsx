
'use client';

import { EnhancedAdminDashboard } from '@/components/dashboards/enhanced-admin-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AdminSkeleton } from '@/components/layout/loading-variants';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']} loadingFallback={<AdminSkeleton />}>
      <EnhancedAdminDashboard />
    </AuthWrapper>
  );
}
