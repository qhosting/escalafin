
'use client';

import { ModuleManagement } from '@/components/admin/module-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ModuleManagementPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <ModuleManagement />
    </AuthWrapper>
  );
}
