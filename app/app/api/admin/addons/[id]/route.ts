
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.SUPER_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            name,
            displayName,
            description,
            priceMonthly,
            priceYearly,
            type,
            config,
            sortOrder,
            isActive
        } = body;

        const updatedAddon = await prisma.addon.update({
            where: { id: params.id },
            data: {
                // name is generally immutable if used as ID, but can be changed if careful
                displayName,
                description,
                priceMonthly,
                priceYearly: priceYearly || null,
                type,
                config: config ? JSON.stringify(config) : null,
                sortOrder: sortOrder || 0,
                isActive
            }
        });

        // await logAudit(session.user.id, 'ADDON_UPDATE', 'ADDON', updatedAddon.id, { name: updatedAddon.name });

        return NextResponse.json(updatedAddon);
    } catch (error) {
        console.error('Error updating addon:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.SUPER_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Check for active subscriptions
        const activeCount = await prisma.subscriptionAddon.count({
            where: {
                addonId: params.id,
                status: 'ACTIVE'
            }
        });

        if (activeCount > 0) {
            return NextResponse.json(
                { error: 'Cannot delete add-on with active subscriptions' },
                { status: 400 }
            );
        }

        await prisma.addon.delete({
            where: { id: params.id }
        });

        // await logAudit(session.user.id, 'ADDON_DELETE', 'ADDON', params.id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting addon:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
