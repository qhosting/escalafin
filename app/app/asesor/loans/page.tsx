
'use client';

import { LoanList } from '@/components/loans/loan-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorLoansPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR']}>
      <LoanList userRole="ASESOR" />
    </AuthWrapper>
  );
}
