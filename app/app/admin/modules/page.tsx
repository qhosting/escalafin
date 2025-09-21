
'use client';

import { ModuleManagement } from '@/components/admin/module-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function ModuleManagementPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div className="container mx-auto py-6">
        <ModuleManagement />
      </div>
    </AuthWrapper>
  );
}
