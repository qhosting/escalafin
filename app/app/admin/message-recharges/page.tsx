'use client';

import MessageRechargeManagement from '@/components/admin/message-recharge-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export default function MessageRechargesPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <MessageRechargeManagement />
    </AuthWrapper>
  );
}
