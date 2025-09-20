
'use client';

import { CreditApplicationsList } from '@/components/credit-applications/credit-applications-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClientCreditApplicationsPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div className="container mx-auto py-6">
        <CreditApplicationsList />
      </div>
    </AuthWrapper>
  );
}
