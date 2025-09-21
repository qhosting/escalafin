

'use client';

import { ClientList } from '@/components/clients/client-list';
import { AuthWrapper } from '@/components/auth-wrapper';

export const dynamic = 'force-dynamic';

export default function AsesorClientsPage() {
  return (
    <AuthWrapper allowedRoles={['ASESOR', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ClientList userRole="ASESOR" />
        </div>
      </div>
    </AuthWrapper>
  );
}

