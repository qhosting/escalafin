
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AsesorDashboard } from '@/components/dashboards/asesor-dashboard';

export default async function AsesorDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !['ASESOR', 'ADMIN'].includes(session.user.role)) {
    redirect('/auth/login');
  }

  return <AsesorDashboard />;
}
