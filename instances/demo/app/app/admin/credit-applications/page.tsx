
'use client';

import { CreditApplicationsList } from '@/components/credit-applications/credit-applications-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AdminCreditApplicationsPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div>
        <CreditApplicationsList />
      </div>
    </AuthWrapper>
  );
}
