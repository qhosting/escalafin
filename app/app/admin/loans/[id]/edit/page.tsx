
'use client';

import { NewLoanForm } from '@/components/loans/new-loan-form';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewLoanForm loanId={params.id} />
      </div>
    </AuthWrapper>
  );
}
