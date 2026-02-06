
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWhatsAppConfig() {
  console.log('🔄 Iniciando seed de configuración WhatsApp...');

  try {
    // Crear configuración por defecto de WAHA (activa por defecto en el seed)
    const existingConfig = await prisma.wahaConfig.findFirst({
      where: {
        OR: [
          { isActive: true },
          { sessionId: 'default' }
        ]
      }
    });

    if (!existingConfig) {
      await prisma.wahaConfig.create({
        data: {
          sessionId: 'default',
          baseUrl: 'http://waha:3000', // URL por defecto en Docker
          isActive: true,
          paymentReceivedTemplate: `🎉 *¡Pago recibido exitosamente!*
...`, // Mantengo las plantillas
          paymentReminderTemplate: `...`,
          loanApprovedTemplate: `...`,
          marketingTemplate: `...`
        }
      });
      console.log('✅ Configuración por defecto de WAHA creada');
    } else {
      console.log('ℹ️ Ya existe una configuración de WAHA');
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
