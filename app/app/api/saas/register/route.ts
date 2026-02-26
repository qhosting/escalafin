
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { SubscriptionsService } from '@/lib/billing/subscriptions';
import { AurumSyncService } from '@/lib/aurum-sync-service';

export const dynamic = 'force-dynamic';

/**
 * Genera un slug único a partir del nombre de la organización
 */
async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.tenant.findUnique({
            where: { slug }
        });

        if (!existing) return slug;

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

/**
 * Registra una nueva organización (Tenant) y su Super Administrador
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            orgName,
            adminEmail,
            adminPassword,
            adminFirstName,
            adminLastName,
            planName = 'starter'
        } = body;

        // Validación básica
        if (!orgName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        // Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'El email ya está registrado' },
                { status: 400 }
            );
        }

        // Obtener el plan inicial
        const plan = await prisma.plan.findUnique({
            where: { name: planName }
        });

        if (!plan) {
            return NextResponse.json(
                { error: 'El plan seleccionado no es válido' },
                { status: 400 }
            );
        }

        // Crear slug único
        const slug = await generateUniqueSlug(orgName);

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Operación transaccional para asegurar integridad
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear el Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: orgName,
                    slug,
                    status: 'ACTIVE',
                }
            });

            // 2. Crear el Usuario (Super Admin)
            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    tenantId: tenant.id
                }
            });

            // 3. Crear la Suscripción inicial (Trial)
            const subscription = await tx.subscription.create({
                data: {
                    tenantId: tenant.id,
                    planId: plan.id,
                    status: 'TRIALING',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000),
                    trialEndsAt: new Date(Date.now() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000),
                    paymentMethod: 'MANUAL'
                }
            });

            // 4. Crear registro de uso inicial
            await tx.tenantUsage.create({
                data: {
                    tenantId: tenant.id,
                    period: new Date().toISOString().substring(0, 7), // YYYY-MM
                    usersCount: 1, // El admin recién creado
                    loansCount: 0,
                    clientsCount: 0,
                    storageBytes: BigInt(0),
                    apiCalls: 0,
                    smsCount: 0,
                    whatsappCount: 0,
                    reportsCount: 0
                }
            });

            return { tenant, user, subscription };
        });

        console.log(`🚀 Nueva organización registrada: ${orgName} (${slug})`);

        // Disparar sincronización con Master Hub (Fire and forget)
        const nextBillingDate = new Date(Date.now() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        AurumSyncService.syncNewTenant(
            {
                commercialName: orgName,
                email: adminEmail,
            },
            {
                planName: plan.displayName || plan.name,
                amount: Number(plan.priceMonthly) || 0,
                interval: 'monthly',
                nextBillingDate: nextBillingDate,
            }
        ).catch(err => console.error("Error trigger syncNewTenant:", err));

        return NextResponse.json({
            message: 'Organización registrada exitosamente',
            slug,
            tenantId: result.tenant.id,
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error registrando organización:', error);
        return NextResponse.json(
            { error: 'Error interno al registrar la organización' },
            { status: 500 }
        );
    }
}
