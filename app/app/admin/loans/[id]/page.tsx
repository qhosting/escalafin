
'use client';

import { LoanDetails } from '@/components/loans/loan-details';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface LoanDetailPageProps {
  params: {
    id: string;
  };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  return (
    <AuthWrapper allowedRoles={['ADMIN', 'ASESOR']}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoanDetails loanId={params.id} userRole="ADMIN" />
        </div>
      </div>
    </AuthWrapper>
  );
}
