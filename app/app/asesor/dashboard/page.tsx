'use client';

import React from 'react';
import { EnhancedAsesorDashboard } from '@/components/dashboards/enhanced-asesor-dashboard';
import { MobileAsesorDashboard } from '@/components/dashboards/mobile-asesor-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AdminSkeleton } from '@/components/layout/loading-variants';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoSSR } from '@/components/no-ssr';

export const dynamic = 'force-dynamic';

export default function AsesorDashboardPage() {
  const isMobile = useIsMobile();

  return (
    <AuthWrapper allowedRoles={['ASESOR']} loadingFallback={<AdminSkeleton />}>
      <NoSSR fallback={<AdminSkeleton />}>
        {isMobile ? <MobileAsesorDashboard /> : <EnhancedAsesorDashboard />}
      </NoSSR>
    </AuthWrapper>
  );
}
