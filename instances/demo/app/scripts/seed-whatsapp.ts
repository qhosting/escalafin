
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWhatsAppConfig() {
  console.log('🔄 Iniciando seed de configuración WhatsApp...');

  try {
    // Crear configuración por defecto de EvolutionAPI (inactiva)
    const existingConfig = await prisma.evolutionAPIConfig.findFirst({
      where: { 
        OR: [
          { isActive: true },
          { instanceName: 'escalafin-whatsapp' }
        ]
      }
    });

    if (!existingConfig) {
      await prisma.evolutionAPIConfig.create({
        data: {
          instanceName: 'escalafin-whatsapp',
          apiKey: 'your-api-key-here',
          baseUrl: 'https://api.evolutionapi.com',
          isActive: false,
          paymentReceivedTemplate: `🎉 *¡Pago recibido exitosamente!*

Hola {{clientName}},

Hemos recibido tu pago de {{amount}} para el préstamo #{{loanNumber}}.

📅 *Fecha de pago:* {{paymentDate}}
💰 *Monto:* {{amount}}
📄 *Préstamo:* #{{loanNumber}}

¡Gracias por tu puntualidad! Tu historial crediticio se mantiene excelente.

*EscalaFin - Tu aliado financiero*`,

          paymentReminderTemplate: `🔔 *Recordatorio de pago*

Hola {{clientName}},

{{#isOverdue}}
Tu pago de {{amount}} para el préstamo #{{loanNumber}} venció hace {{daysOverdue}} día(s).

⚠️ *Importante:* Para evitar cargos adicionales, realiza tu pago lo antes posible.
{{/isOverdue}}
{{^isOverdue}}
Tu pago de {{amount}} para el préstamo #{{loanNumber}} vence el {{dueDate}}.

Puedes realizar tu pago a través de nuestra plataforma web o contacta a tu asesor.
{{/isOverdue}}

💰 *Monto:* {{amount}}
📄 *Préstamo:* #{{loanNumber}}
📅 *Fecha de vencimiento:* {{dueDate}}

*EscalaFin - Tu aliado financiero*`,

          loanApprovedTemplate: `✅ *¡Préstamo aprobado!*

¡Felicidades {{clientName}}!

Tu solicitud de préstamo ha sido aprobada.

💰 *Monto aprobado:* {{amount}}
📄 *Número de préstamo:* #{{loanNumber}}
💳 *Pago mensual:* {{monthlyPayment}}
📅 *Plazo:* {{termMonths}} meses

Los fondos serán depositados en tu cuenta en las próximas 24-48 horas hábiles.

*EscalaFin - Tu aliado financiero*`,

          marketingTemplate: `📢 *EscalaFin te informa*

Hola {{clientName}},

{{message}}

Para más información contacta a tu asesor o visita nuestra plataforma.

*EscalaFin - Tu aliado financiero*`
        }
      });

      console.log('✅ Configuración por defecto de EvolutionAPI creada');
    } else {
      console.log('ℹ️ Ya existe una configuración activa de EvolutionAPI');
    }

    // Los campos de WhatsApp ya tienen valores por defecto en el esquema
    console.log('ℹ️ Las configuraciones de WhatsApp se aplicarán automáticamente a nuevos clientes');

    console.log('🎉 Seed de configuración WhatsApp completado exitosamente');
  } catch (error) {
    console.error('❌ Error en seed de configuración WhatsApp:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedWhatsAppConfig();
  } catch (error) {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export default seedWhatsAppConfig;
