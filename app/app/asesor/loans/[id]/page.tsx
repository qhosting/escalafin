
'use client';

import { LoanDetail } from '@/components/loans/loan-detail';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function AsesorLoanDetailPage({ params }: Props) {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <div>
        <div>
          <LoanDetail loanId={params.id} userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}
