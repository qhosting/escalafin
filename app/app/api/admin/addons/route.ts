
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.SUPER_ADMIN) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const addons = await prisma.addon.findMany({
            orderBy: { sortOrder: 'asc' }
        });

        // Add active subscriber count to response
        const addonsWithStats = await Promise.all(addons.map(async (addon) => {
            const count = await prisma.subscriptionAddon.count({
                where: {
                    addonId: addon.id,
                    status: 'ACTIVE'
                }
            });
            return {
                ...addon,
                activeCount: count
            };
        }));

        return NextResponse.json(addonsWithStats);
    } catch (error) {
        console.error('Error fetching addons:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(request: Request) {
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
            sortOrder
        } = body;

        // Basic validation
        if (!name || !displayName || priceMonthly === undefined || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const existing = await prisma.addon.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Add-on with this ID already exists' },
                { status: 400 }
            );
        }

        const newAddon = await prisma.addon.create({
            data: {
                name,
                displayName,
                description,
                priceMonthly,
                priceYearly: priceYearly || null,
                type,
                config: config ? JSON.stringify(config) : null,
                sortOrder: sortOrder || 0,
                isActive: true
            }
        });

        // Log audit
        // await logAudit(session.user.id, 'ADDON_CREATE', 'ADDON', newAddon.id, { name: newAddon.name });

        return NextResponse.json(newAddon);
    } catch (error) {
        console.error('Error creating addon:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
