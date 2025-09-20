
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoanForm loanId={params.id} userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}
