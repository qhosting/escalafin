
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { seedTenantData } from '@/lib/infrastructure-seeding';

export async function POST(req: NextRequest) {
    try {
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
            const plan = await tx.plan.findFirst({
                where: { isActive: true },
                orderBy: { priceMonthly: 'asc' }
            });

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
