
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const includeClient = searchParams.get('includeClient') === 'true';
    const status = searchParams.get('status') || 'ACTIVE';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        loans: [],
        message: 'Por favor ingresa al menos 2 caracteres para buscar'
      });
    }

    const searchTerm = query.trim();

    // Build search conditions
    const whereConditions: any = {
      status: status,
      OR: [
        {
          loanNumber: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          client: {
            OR: [
              {
                firstName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                phone: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ]
    };

    // If user is a client, only show their loans
    if (session.user.role === 'CLIENTE') {
      // Need to find the client profile for this user
      const clientProfile = await prisma.client.findFirst({
        where: { userId: session.user.id }
      });
      if (clientProfile) {
        whereConditions.clientId = clientProfile.id;
      }
    }

    const loans = await prisma.loan.findMany({
      where: whereConditions,
      include: includeClient ? {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true
          },
          orderBy: {
            paymentDate: 'desc'
          },
          take: 3
        }
      } : {
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { status: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50 // Limit results to prevent performance issues
    });

    return NextResponse.json({
      loans,
      count: loans.length,
      searchTerm
    });

  } catch (error) {
    console.error('Error searching loans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
