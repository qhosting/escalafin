'use client';

import React from 'react';
import { EnhancedClientDashboard } from '@/components/dashboards/enhanced-client-dashboard';
import { MobileClientDashboard } from '@/components/dashboards/mobile-client-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { ClienteSkeleton } from '@/components/layout/loading-variants';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoSSR } from '@/components/no-ssr';

export const dynamic = 'force-dynamic';

export default function ClienteDashboardPage() {
  const isMobile = useIsMobile();

  return (
    <AuthWrapper allowedRoles={['CLIENTE']} loadingFallback={<ClienteSkeleton />}>
      <NoSSR fallback={<ClienteSkeleton />}>
        {isMobile ? <MobileClientDashboard /> : <EnhancedClientDashboard />}
      </NoSSR>
    </AuthWrapper>
  );
}
