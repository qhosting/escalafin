
import { prisma } from '@/lib/prisma';
import { MessageTemplateType, MessageChannel } from '@prisma/client';

export interface DefaultTemplate {
    name: string;
    description: string;
    category: MessageTemplateType;
    channel: MessageChannel;
    template: string;
    variables: string;
    isActive: boolean;
}

export const defaultTemplates: DefaultTemplate[] = [
    {
        name: 'Bienvenida WhatsApp',
        description: 'Mensaje de bienvenida al crear cuenta',
        category: MessageTemplateType.ACCOUNT_CREATED,
        channel: MessageChannel.WHATSAPP,
        template: '¡Hola {firstName}! 👋\n\n¡Bienvenido a {companyName}! Tu cuenta ha sido creada exitosamente.\n\n📧 Usuario: {email}\n\nEstamos aquí para ayudarte.',
        variables: 'firstName, companyName, email',
        isActive: true,
    },
    {
        name: 'Recordatorio de Pago',
        description: 'Recordatorio de pago próximo',
        category: MessageTemplateType.PAYMENT_REMINDER,
        channel: MessageChannel.WHATSAPP,
        template: '⏰ Recordatorio de Pago\n\nHola {firstName},\n\nTe recordamos que tienes un pago próximo:\n\n💰 Monto: ${amount} MXN\n📅 Fecha de vencimiento: {dueDate}\n📝 Préstamo: #{loanNumber}',
        variables: 'firstName, amount, dueDate, loanNumber',
        isActive: true,
    },
    {
        name: 'Pago Recibido',
        description: 'Confirmación de pago recibido',
        category: MessageTemplateType.PAYMENT_RECEIVED,
        channel: MessageChannel.WHATSAPP,
        template: '¡Pago recibido! ✅\n\n💰 Monto: ${amount} MXN\n📝 Préstamo: #{loanNumber}\n📅 Fecha: {date}\n\n¡Gracias por tu pago puntual!',
        variables: 'amount, loanNumber, date',
        isActive: true,
    },
];

/**
 * Seeds a new tenant with default data (templates, config, etc.)
 */
export async function seedTenantData(tenantId: string, companyName: string) {
    try {
        console.log(`🌱 Seeding initial data for tenant ${tenantId} (${companyName})`);

        // Seed Message Templates
        const templatesWithTenant = defaultTemplates.map(t => ({
            ...t,
            tenantId,
            template: t.template.replace('{companyName}', companyName)
        }));

        await prisma.messageTemplate.createMany({
            data: templatesWithTenant,
            skipDuplicates: true
        });

        console.log(`✅ Data seeded successfully for tenant ${tenantId}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Error seeding tenant data for ${tenantId}:`, error);
        return { success: false, error };
    }
}
