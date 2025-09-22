
'use client';

import { LoanDetail } from '@/components/loans/loan-detail';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function ClienteLoanDetailPage({ params }: Props) {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div>
        <div>
          <LoanDetail loanId={params.id} userRole="CLIENTE" />
        </div>
      </div>
    </AuthWrapper>
  );
}
