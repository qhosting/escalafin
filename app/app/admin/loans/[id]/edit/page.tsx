
'use client';

import { LoanForm } from '@/components/loans/loan-form';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function AdminEditLoanPage({ params }: Props) {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div>
        <div>
          <LoanForm loanId={params.id} userRole="ADMIN" />
        </div>
      </div>
    </AuthWrapper>
  );
}
