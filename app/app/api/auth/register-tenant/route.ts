
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { seedTenantData } from '@/lib/infrastructure-seeding';
import { AurumSyncService } from '@/lib/aurum-sync-service';
import { RateLimiter } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        // 🛡️ Rate Limiting por IP (Máximo 3 registros por hora para evitar spam)
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown';
        const rateLimit = await RateLimiter.checkByIp(clientIp, 'register-tenant', 3, 3600);
        
        if (!rateLimit.success) {
            return NextResponse.json({ 
                error: `Límite de registros excedido. Por favor, intente nuevamente en una hora.` 
            }, { status: 429 });
        }

        const body = await req.json();
        const { companyName, email, password, firstName, lastName, phone } = body;

        // Validaciones
        if (!companyName || !email || !password) {
            return new NextResponse("Faltan campos requeridos", { status: 400 });
        }

        // Verificar unicidad de email (User)
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return new NextResponse("El usuario ya existe", { status: 400 });
        }

        // Crear slug del tenant
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Verificar unicidad de slug (Tenant)
        const tenantExists = await prisma.tenant.findUnique({ where: { slug } });
        if (tenantExists) {
            return new NextResponse("El nombre de la empresa ya está registrado. Intenta con otro.", { status: 400 });
        }

        // Transacción de creación
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear Usuario
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phone,
                    role: 'ADMIN', // Primer usuario es Admin
                    status: 'ACTIVE'
                }
            });

            // 2. Crear Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug,
                    status: 'ACTIVE',
                    // ownerId se asignará en paso posterior para evitar errores de tipo si el generate falló
                }
            });

            // 3. Vincular usuario al tenant
            await tx.user.update({
                where: { id: user.id },
                data: { tenantId: tenant.id }
            });

            // 3.5 Asignar owner al tenant (OMITIDO: No existe ownerId en schema actual)
            // Cualquier ADMIN en el tenant se considera administrador.

            // 4. Crear Suscripción (Trial)
            // Buscar plan default (idealmente 'starter' o el más barato)
            let plan = await tx.plan.findFirst({
                where: { isActive: true },
                orderBy: { priceMonthly: 'asc' }
            });

            // Si no hay planes, crear uno por defecto para no romper el flujo
            if (!plan) {
                console.log('🌱 No hay planes activos, creando Plan Inicial default...');
                plan = await tx.plan.create({
                    data: {
                        name: 'starter',
                        displayName: 'Plan Inicial',
                        description: 'Plan básico auto-creado',
                        priceMonthly: 0,
                        features: JSON.stringify(["Funciones básicas"]),
                        limits: JSON.stringify({ users: 3, loans: 100 }),
                        isActive: true
                    }
                });
            }

            if (plan) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + (plan.trialDays || 14));

                await tx.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        planId: plan.id,
                        status: 'TRIALING',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: trialEnd,
                        trialEndsAt: trialEnd
                    }
                });
            }

            return { user, tenant };
        });

        // 5. Sembrado de datos iniciales (Mensajes, Configuración)
        await seedTenantData(result.tenant.id, companyName);

        // Disparar sincronización con Master Hub (Fire and forget)
        AurumSyncService.syncNewTenant(
            {
                commercialName: companyName,
                email: email,
            },
            {
                planName: 'Plan Inicial (Trial)',
                amount: 0,
                interval: 'monthly',
                nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }
        ).catch(err => console.error("Error trigger syncNewTenant:", err));

        // 6. Enviar Email de Bienvenida (sin bloquear la respuesta)
        const template = emailTemplates.welcomeTenant(firstName, companyName);
        sendEmail({
            to: email,
            subject: template.subject,
            html: template.html
        }).catch(err => console.error("Error sending welcome email:", err));

        return NextResponse.json({ success: true, tenantId: result.tenant.id }, { status: 201 });

    } catch (error) {
        console.error("Error registering tenant:", error);
        return new NextResponse("Error interno al registrar la empresa", { status: 500 });
    }
}
