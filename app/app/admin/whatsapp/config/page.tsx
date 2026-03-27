
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WahaConfig from '@/components/admin/waha-config';
import { PageLoader } from '@/components/ui/page-loader';

export default function WhatsAppConfigPage() {
  const sessionResult = useSession();
  const { data: session, status } = sessionResult || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <PageLoader message="Validando suscripción y planes..." />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return <WahaConfig />;
}
