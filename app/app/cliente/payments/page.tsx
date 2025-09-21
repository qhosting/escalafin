

'use client';

import { PaymentHistory } from '@/components/payments/payment-history';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ClientePaymentsPage() {
  return (
    <AuthWrapper allowedRoles={['CLIENTE']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PaymentHistory userRole="CLIENTE" />
        </div>
      </div>
    </AuthWrapper>
  );
}

