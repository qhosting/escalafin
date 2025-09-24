

'use client';

import { PaymentHistory } from '@/components/payments/payment-history';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClientePaymentsPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div>
        <div>
          <PaymentHistory userRole="CLIENTE" />
        </div>
      </div>
    </AuthWrapper>
  );
}

