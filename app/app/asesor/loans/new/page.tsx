
'use client';

import { LoanForm } from '@/components/loans/loan-form';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorNewLoanPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoanForm userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}
