

'use client';

import { ClientList } from '@/components/clients/client-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorClientsPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR', 'ADMIN']}>
      <div>
        <div>
          <ClientList userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}

