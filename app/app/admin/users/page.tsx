

'use client';

import { UserManagement } from '@/components/admin/user-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function UsersManagementPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserManagement />
        </div>
      </div>
    </AuthWrapper>
  );
}
