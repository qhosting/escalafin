
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para registro de nuevas ORGANIZACIONES (Tenants)
 * Crea el Tenant y el usuario administrador inicial.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            orgName,
            orgSlug,
            adminEmail,
            adminPassword,
            adminFirstName,
            adminLastName,
            adminPhone,
            token // Recibimos el token opcional
        } = body;

        // 1. Validaciones de entrada
        if (!orgName || !orgSlug || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
            return NextResponse.json(
                { error: 'Todos los campos requeridos deben ser completados' },
                { status: 400 }
            );
        }

        // 2. Verificar si el slug ya existe
        const existingTenant = await prisma.tenant.findUnique({
            where: { slug: orgSlug.toLowerCase() }
        });

        if (existingTenant) {
            return NextResponse.json(
                { error: 'El nombre de usuario/slug de la organización ya está en uso' },
                { status: 400 }
            );
        }

        // 3. Verificar si el email del admin ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail.toLowerCase() }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con este correo electrónico' },
                { status: 400 }
            );
        }

        // 4. Si hay un token, validarlo
        if (token) {
            const invitation = await prisma.tenantInvitation.findUnique({
                where: { token }
            });

            if (!invitation || invitation.status !== 'PENDING' || (new Date() > invitation.expiresAt)) {
                return NextResponse.json(
                    { error: 'Invitación no válida o expirada' },
                    { status: 400 }
                );
            }
        }

        // 5. Crear el Tenant y el Admin en una transacción
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const result = await prisma.$transaction(async (tx) => {
            // a. Crear el Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: orgName,
                    slug: orgSlug.toLowerCase(),
                    status: 'ACTIVE',
                }
            });

            // b. Crear el Usuario Admin para ese Tenant
            const user = await tx.user.create({
                data: {
                    email: adminEmail.toLowerCase(),
                    password: hashedPassword,
                    firstName: adminFirstName,
                    lastName: adminLastName,
                    phone: adminPhone || null,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    tenantId: tenant.id
                }
            });

            // c. Crear configuraciones iniciales por defecto para el tenant
            await tx.systemConfig.create({
                data: {
                    key: 'REGISTRATION_ENABLED',
                    value: 'true',
                    description: 'Habilitar registro de clientes en esta organización',
                    category: 'AUTHENTICATION',
                    tenantId: tenant.id
                }
            });

            // d. Marcar invitación como aceptada si existe el token
            if (token) {
                await tx.tenantInvitation.update({
                    where: { token },
                    data: {
                        status: 'ACCEPTED',
                        acceptedAt: new Date()
                    }
                });
            }

            return { tenant, user };
        });

        return NextResponse.json(
            {
                message: 'Organización registrada exitosamente',
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name,
                    slug: result.tenant.slug
                },
                user: {
                    id: result.user.id,
                    email: result.user.email
                }
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error registrando organización:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor al procesar el registro' },
            { status: 500 }
        );
    }
}
