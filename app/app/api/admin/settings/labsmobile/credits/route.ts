
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LabsMobileService from '@/lib/labsmobile';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const labsmobile = new LabsMobileService();
    const credits = await labsmobile.getCredits();

    return NextResponse.json({ credits });

  } catch (error) {
    console.error('Error consultando créditos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
