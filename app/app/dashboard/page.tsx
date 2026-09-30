'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/page-loader';
import { getDashboardHref } from '@/lib/navigation';

export default function DashboardRedirectPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    const role = (session as any)?.user?.role;
    const target = getDashboardHref(role);
    router.replace(target);
  }, [session, status, router]);

  return <PageLoader message="Redirigiendo a tu panel de control..." />;
}
