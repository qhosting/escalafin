

'use client';

import { UserManagement } from '@/components/admin/user-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export default function UsersManagementPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <UserManagement />
    </AuthWrapper>
  );
}
