
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: Get global system configurations
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const configs = await prisma.systemConfig.findMany({
            where: { 
                tenantId: null,
                ...(category ? { category } : {})
            }
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error('Error fetching global configs:', error);
        return NextResponse.json({ error: 'Fallo al obtener configuración' }, { status: 500 });
    }
}

/**
 * Super Admin: Update or Create global system configurations
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { configs } = body; // Array of { key, value, category, description }

        if (!Array.isArray(configs)) {
            return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
        }

        const results = await prisma.$transaction(
            configs.map((config) => 
                prisma.systemConfig.upsert({
                    where: { 
                        key_tenantId: {
                            key: config.key,
                            tenantId: null as any // Type cast because tenantId is nullable but in unique constraint
                        }
                    },
                    update: {
                        value: config.value,
                        category: config.category,
                        description: config.description,
                        updatedBy: session.user.id
                    },
                    create: {
                        key: config.key,
                        value: config.value,
                        category: config.category,
                        description: config.description,
                        tenantId: null,
                        updatedBy: session.user.id
                    }
                })
            )
        );

        return NextResponse.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Error saving global configs:', error);
        return NextResponse.json({ error: 'Fallo al guardar configuración' }, { status: 500 });
    }
}
