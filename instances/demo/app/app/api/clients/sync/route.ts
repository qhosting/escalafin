
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientData = await request.json();

    // Validate required fields
    if (!clientData.id && !clientData.email) {
      return NextResponse.json(
        { error: 'ID o email del cliente requerido' },
        { status: 400 }
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { id: clientData.id },
          { email: clientData.email }
        ]
      }
    });

    let result;

    if (existingClient) {
      // Update existing client
      result = await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          city: clientData.city,
          state: clientData.state,
          postalCode: clientData.zipCode,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new client
      result = await prisma.client.create({
        data: {
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          email: clientData.email,
          phone: clientData.phone || '',
          address: clientData.address || '',
          city: clientData.city || '',
          state: clientData.state || '',
          postalCode: clientData.zipCode || '',
          monthlyIncome: clientData.monthlyIncome || 0,
          creditScore: clientData.creditScore || 0,
          employmentType: clientData.employmentType || 'EMPLEADO',
          bankName: clientData.bankName || '',
          userId: session.user.role === 'ASESOR' ? session.user.id : undefined
        }
      });
    }

    return NextResponse.json({
      success: true,
      client: result,
      action: existingClient ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Error syncing client:', error);
    return NextResponse.json(
      { error: 'Error sincronizando cliente' },
      { status: 500 }
    );
  }
}
