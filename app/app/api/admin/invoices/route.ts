
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Super Admin: List global invoices and generate manual ones
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const invoices = await prisma.invoice.findMany({
            where: status ? { status: status as any } : undefined,
            include: {
                subscription: {
                    include: {
                        tenant: true,
                        plan: true
                    }
                }
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        });

        const total = await prisma.invoice.count({
            where: status ? { status: status as any } : undefined
        });

        return NextResponse.json({
            invoices,
            total,
            limit,
            offset
        });

    } catch (error) {
        console.error('Error fetching global invoices:', error);
        return NextResponse.json(
            { error: 'Error al obtener facturas globales' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Generate a manual invoice for a subscription
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { subscriptionId, amount, description, dueDate } = body;

        if (!subscriptionId || !amount) {
            return NextResponse.json(
                { error: 'subscriptionId y amount son requeridos' },
                { status: 400 }
            );
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true }
        });

        if (!subscription) {
            return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
        }

        // Generate a unique invoice number
        const now = new Date();
        const invoiceNumber = `MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const invoice = await prisma.invoice.create({
            data: {
                subscriptionId,
                invoiceNumber,
                amount: parseFloat(amount),
                subtotal: parseFloat(amount),
                tax: 0,
                currency: subscription.plan.currency || 'MXN',
                status: 'OPEN',
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days grace by default
                lineItems: JSON.stringify([
                    {
                        description: description || 'Cargo manual administrativo',
                        amount: parseFloat(amount),
                        quantity: 1
                    }
                ]),
                notes: `Generada manualmente por ${session.user.email}`
            }
        });

        return NextResponse.json({
            success: true,
            invoice,
            message: 'Factura manual generada correctamente'
        });

    } catch (error) {
        console.error('Error creating manual invoice:', error);
        return NextResponse.json(
            { error: 'Error al generar factura manual' },
            { status: 500 }
        );
    }
}
