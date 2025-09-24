

'use client';

import { CreditApplicationsList } from '@/components/credit-applications/credit-applications-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClienteCreditApplicationsPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div>
        <div>
          <CreditApplicationsList />
        </div>
      </div>
    </AuthWrapper>
  );
}

