
'use client';

import { LoanList } from '@/components/loans/loan-list';
import { AuthWrapper } from '@/components/auth-wrapper';
import { LoanListSkeleton } from '@/components/loans/loan-list-skeleton';

export const dynamic = 'force-dynamic';

export default function AdminLoansPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']} loadingFallback={<LoanListSkeleton />}>
      <LoanList userRole="ADMIN" />
    </AuthWrapper>
  );
}
