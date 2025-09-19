
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Redirigir según el rol del usuario
  switch (session.user.role) {
    case 'ADMIN':
      redirect('/admin/dashboard');
    case 'ASESOR':
      redirect('/asesor/dashboard');
    case 'CLIENTE':
      redirect('/cliente/dashboard');
    default:
      redirect('/auth/login');
  }
}
