

'use client';

import { UserManagement } from '@/components/admin/user-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function UsersManagementPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <UserManagement />
    </AuthWrapper>
  );
}
