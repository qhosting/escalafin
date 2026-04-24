'use client';

import React from 'react';
import { EnhancedAdminDashboard } from '@/components/dashboards/enhanced-admin-dashboard';
import { MobileAdminDashboard } from '@/components/dashboards/mobile-admin-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AdminSkeleton } from '@/components/layout/loading-variants';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoSSR } from '@/components/no-ssr';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const isMobile = useIsMobile();

  return (
    <AuthWrapper allowedRoles={['ADMIN']} loadingFallback={<AdminSkeleton />}>
      <NoSSR fallback={<AdminSkeleton />}>
        {isMobile ? <MobileAdminDashboard /> : <EnhancedAdminDashboard />}
      </NoSSR>
    </AuthWrapper>
  );
}
