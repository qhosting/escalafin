
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WhatsAppClientSettings from '@/components/admin/whatsapp-client-settings';
import { PageLoader } from '@/components/ui/page-loader';

export default function WhatsAppClientsPage() {
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
    return <PageLoader message="Gestionando contactos automatizados..." />;
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return <WhatsAppClientSettings />;
}
