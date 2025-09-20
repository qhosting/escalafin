
'use client';

import { LoanList } from '@/components/loans/loan-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClienteLoansPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoanList userRole="CLIENTE" />
        </div>
      </div>
    </AuthWrapper>
  );
}
