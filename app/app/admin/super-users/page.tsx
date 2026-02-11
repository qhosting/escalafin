
'use client';

import { UserManagement } from '@/components/admin/user-management';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function SuperUsersManagementPage() {
    return (
        <AuthWrapper allowedRoles={['SUPER_ADMIN']}>
            <UserManagement
                apiEndpoint="/api/admin/super-users"
                title="Gestión de Super Admins"
                allowedRoles={['SUPER_ADMIN']}
            />
        </AuthWrapper>
    );
}
