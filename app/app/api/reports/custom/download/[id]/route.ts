
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const generation = await prisma.customReportGeneration.findUnique({
            where: { id: params.id },
            include: { template: true }
        });

        if (!generation || !generation.filePath) {
            return new NextResponse('Report not found', { status: 404 });
        }

        // Seguridad: Verificar que el usuario tenga acceso (propietario o admin si es pública)
        if (generation.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const absolutePath = path.resolve(generation.filePath);

        if (!fs.existsSync(absolutePath)) {
            return new NextResponse('File not found on server', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(absolutePath);
        const fileName = path.basename(absolutePath);

        return new NextResponse(fileBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error) {
        console.error('Error downloading report:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
