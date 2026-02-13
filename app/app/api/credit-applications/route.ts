export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { ApplicationStatus, LoanType } from '@prisma/client';
import { LimitsService } from '@/lib/billing/limits';
import { UsageTracker } from '@/lib/billing/usage-tracker';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const clientId = searchParams.get('clientId');
        const asesorId = searchParams.get('asesorId');

        let whereClause: any = {};

        // Filtros según rol
        if (session.user.role === 'ASESOR') {
            whereClause.asesorId = session.user.id;
        } else if (session.user.role === 'CLIENTE') {
            whereClause.clientId = session.user.id;
        }

        // Filtros adicionales
        if (status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
            whereClause.status = status as ApplicationStatus;
        }

        if (clientId) {
            whereClause.clientId = clientId;
        }

        if (asesorId && session.user.role === 'ADMIN') {
            whereClause.asesorId = asesorId;
        }

        const applications = await tenantPrisma.creditApplication.findMany({
            where: whereClause,
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        monthlyIncome: true,
                        creditScore: true
                    }
                },
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                reviewedByUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                loan: {
                    select: {
                        id: true,
                        loanNumber: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(applications);

    } catch (error) {
        console.error('Error fetching credit applications:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        // 💡 Verificación de Límites SaaS
        const limitError = await LimitsService.middleware(tenantId || '', 'credit_applications');
        if (limitError) return limitError;

        const body = await request.json();
        const {
            clientId,
            loanType,
            requestedAmount,
            requestedTerm,
            purpose
        } = body;

        // Validaciones
        if (!clientId || !loanType || !requestedAmount || !requestedTerm) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
        }

        const application = await tenantPrisma.creditApplication.create({
            data: {
                clientId,
                loanType: loanType as LoanType,
                requestedAmount: parseFloat(requestedAmount),
                requestedTerm: parseInt(requestedTerm),
                purpose: purpose || '',
                status: ApplicationStatus.PENDING,
                asesorId: session.user.id
            },
            include: {
                client: true,
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // 📈 Incrementar uso en SaaS
        if (tenantId) {
            await UsageTracker.incrementUsage(tenantId, 'creditApplicationsCount');
        }

        return NextResponse.json(application, { status: 201 });

    } catch (error) {
        console.error('Error creating credit application:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
