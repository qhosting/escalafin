
'use client';

import { LoanDetails } from '@/components/loans/loan-details';
import { AuthWrapper } from '@/components/auth-wrapper';

import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const dynamic = 'force-dynamic';

interface LoanDetailPageProps {
  params: {
    id: string;
  };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  return (
    <AuthWrapper allowedRoles={['ADMIN', 'ASESOR']}>
      <Suspense fallback={<div className="flex items-center justify-center p-20"><LoadingSpinner size="lg" /></div>}>
        <LoanDetails loanId={params.id} userRole="ADMIN" />
      </Suspense>
    </AuthWrapper>
  );
}
