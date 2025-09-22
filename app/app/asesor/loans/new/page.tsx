
'use client';

import { LoanForm } from '@/components/loans/loan-form';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorNewLoanPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <div>
        <div>
          <LoanForm userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}
