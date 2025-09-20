
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOpenpayClient } from '@/lib/openpay';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chargeId = params.id;
    
    if (!chargeId) {
      return NextResponse.json(
        { error: 'ID de transacción requerido' },
        { status: 400 }
      );
    }

    const openpayClient = getOpenpayClient();
    const charge = await openpayClient.getCharge(chargeId);

    return NextResponse.json({
      id: charge.id,
      status: charge.status,
      amount: charge.amount,
      method: charge.method,
      authorization: charge.authorization,
      error_message: charge.error_message,
      creation_date: charge.creation_date,
      operation_date: charge.operation_date,
    });
  } catch (error) {
    console.error('Error fetching Openpay charge:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al consultar el estado del pago'
      },
      { status: 500 }
    );
  }
}
