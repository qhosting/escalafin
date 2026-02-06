
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customReportService } from '@/lib/custom-report-service';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const templates = await customReportService.getTemplates(session.user.id);
        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching report templates:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { name, description, config, category, isPublic } = body;

        if (!name || !config) {
            return NextResponse.json({ error: 'Name and config are required' }, { status: 400 });
        }

        const templateId = await customReportService.createTemplate(
            name,
            description,
            config,
            session.user.id,
            category,
            isPublic
        );

        return NextResponse.json({ success: true, id: templateId });
    } catch (error) {
        console.error('Error creating report template:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
