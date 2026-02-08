import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ConfigService, LoanTariffConfig } from '@/lib/config-service';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId as string;
        const config = await ConfigService.getLoanTariffs(tenantId);
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const newConfig = await request.json() as LoanTariffConfig;

        // Básica validación de estructura
        if (!newConfig.fixedFee || !newConfig.weeklyInterest) {
            return NextResponse.json({ error: 'Estructura de configuración inválida' }, { status: 400 });
        }

        const tenantId = session.user.tenantId as string;
        await ConfigService.updateLoanTariffs(tenantId, newConfig, session.user.id);

        return NextResponse.json({ success: true, message: 'Configuración actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
