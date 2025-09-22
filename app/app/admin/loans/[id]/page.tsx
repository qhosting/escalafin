
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
      <div>
        <div>
          <LoanDetails loanId={params.id} userRole="ADMIN" />
        </div>
      </div>
    </AuthWrapper>
  );
}
