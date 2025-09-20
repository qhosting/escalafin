
'use client';

import { LoanDetail } from '@/components/loans/loan-detail';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default function AdminLoanDetailPage({ params }: Props) {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoanDetail loanId={params.id} userRole="ADMIN" />
        </div>
      </div>
    </AuthWrapper>
  );
}
