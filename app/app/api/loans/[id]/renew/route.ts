import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RefinanceService } from '@/lib/refinance-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 400 });
    }

    const body = await request.json();
    const { newLoanData } = body;

    if (!newLoanData) {
      return NextResponse.json({ error: 'Datos de renovación incompletos' }, { status: 400 });
    }

    const refinanceService = new RefinanceService(tenantId);
    
    const result = await refinanceService.renew({
      originalLoanId: params.id,
      newLoanData: {
        ...newLoanData,
        startDate: new Date(newLoanData.startDate)
      },
      processedBy: session.user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Préstamo renovado exitosamente',
      loan: result 
    });

  } catch (error: any) {
    console.error('Error en renovación:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
