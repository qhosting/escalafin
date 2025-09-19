
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClienteDashboard } from '@/components/dashboards/cliente-dashboard';

export default async function ClienteDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !['CLIENTE', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/login');
  }

  return <ClienteDashboard />;
}
