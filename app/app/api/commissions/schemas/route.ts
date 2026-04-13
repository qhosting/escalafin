
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const schemas = await prisma.commissionSchema.findMany({
      where: { tenantId: session.user.tenantId }
    });

    return NextResponse.json({ success: true, schemas });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar esquemas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const schema = await prisma.commissionSchema.create({
      data: {
        ...body,
        rules: typeof body.rules === 'string' ? body.rules : JSON.stringify(body.rules),
        tenantId: session.user.tenantId
      }
    });

    return NextResponse.json({ success: true, schema });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear esquema' }, { status: 500 });
  }
}
