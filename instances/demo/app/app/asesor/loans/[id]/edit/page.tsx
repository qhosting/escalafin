
'use client';

import { LoanForm } from '@/components/loans/loan-form';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function AsesorEditLoanPage({ params }: Props) {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <div>
        <div>
          <LoanForm loanId={params.id} userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}
