
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
    let bodyData: any = null;
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        bodyData = await request.json();
        const { configs } = bodyData; // Array of { key, value, category, description }

        if (!Array.isArray(configs)) {
            console.error('❌ Formato de configs inválido:', typeof configs);
            return NextResponse.json({ error: 'Formato inválido: se esperaba un array de configuraciones' }, { status: 400 });
        }
        
        console.log(`📝 Guardando ${configs.length} configuraciones globales...`);

        const results = await prisma.$transaction(async (tx) => {
            const updatedConfigs = [];
            
            for (const config of configs) {
                if (!config.key) {
                    console.warn('⚠️ Omitiendo config sin key:', config);
                    continue;
                }

                const existing = await tx.systemConfig.findFirst({
                    where: {
                        key: config.key,
                        tenantId: null
                    }
                });

                if (existing) {
                    const updated = await tx.systemConfig.update({
                        where: { id: existing.id },
                        data: {
                            value: config.value !== undefined ? String(config.value) : existing.value,
                            category: config.category || existing.category,
                            description: config.description || existing.description,
                            updatedBy: session.user.id
                        }
                    });
                    updatedConfigs.push(updated);
                } else {
                    const created = await tx.systemConfig.create({
                        data: {
                            key: config.key,
                            value: String(config.value || ''),
                            category: config.category || 'GLOBAL',
                            description: config.description || '',
                            tenantId: null,
                            updatedBy: session.user.id
                        }
                    });
                    updatedConfigs.push(created);
                }
            }
            return updatedConfigs;
        }, {
            timeout: 10000 // 10 seconds timeout for safety
        });

        // Log the achievement
        const { AuditLogger } = await import('@/lib/audit');
        await AuditLogger.quickLog(request, 'SYSTEM_CONFIG_UPDATE', { count: results.length, keys: results.map(c => c.key) }, 'SystemSettings', 'GLOBAL', session);

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('❌ Error saving global configs:', error);
        return NextResponse.json({ 
            error: 'Fallo al guardar configuración', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
