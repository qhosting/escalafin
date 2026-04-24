'use client';

import { useState, useEffect } from 'react';
import { EnhancedAsesorDashboard } from '@/components/dashboards/enhanced-asesor-dashboard';
import { MobileAsesorDashboard } from '@/components/dashboards/mobile-asesor-dashboard';
import { AuthWrapper } from '@/components/auth-wrapper';
import { AdminSkeleton } from '@/components/layout/loading-variants';
import { useIsMobile } from '@/hooks/use-mobile';

export const dynamic = 'force-dynamic';

export default function AsesorDashboardPage() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AdminSkeleton />;
  }

  return (
    <AuthWrapper allowedRoles={['ASESOR']} loadingFallback={<AdminSkeleton />}>
      {isMobile ? <MobileAsesorDashboard /> : <EnhancedAsesorDashboard />}
    </AuthWrapper>
  );
}
