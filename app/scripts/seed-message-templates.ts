import { PrismaClient, MessageTemplateType, MessageChannel } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTemplates = [
  // SMS Templates (160 caracteres máximo)
  {
    name: 'SMS Cuenta Creada',
    description: 'Mensaje de bienvenida al crear cuenta',
    category: 'ACCOUNT_CREATED' as MessageTemplateType,
    channel: 'SMS' as MessageChannel,
    template: 'Hola {nombre}, bienvenido a EscalaFin! Tu cuenta ha sido creada. Usuario: {email}',
    variables: 'nombre, email',
    maxLength: 160,
    isActive: true,
  },
  {
    name: 'SMS Pago Recibido',
    description: 'Confirmación de pago recibido',
    category: 'PAYMENT_RECEIVED' as MessageTemplateType,
    channel: 'SMS' as MessageChannel,
    template: 'Pago recibido! ${monto} MXN para prestamo #{numero}. Fecha: {fecha}. Gracias!',
    variables: 'monto, numero, fecha',
    maxLength: 160,
    isActive: true,
  },
  {
    name: 'SMS Recordatorio de Pago',
    description: 'Recordatorio de pago próximo',
    category: 'PAYMENT_REMINDER' as MessageTemplateType,
    channel: 'SMS' as MessageChannel,
    template: 'Recordatorio: Tu pago de ${monto} MXN vence el {fecha}. Prestamo #{numero}.',
    variables: 'monto, fecha, numero',
    maxLength: 160,
    isActive: true,
  },
  {
    name: 'SMS Pago Vencido',
    description: 'Notificación de pago vencido',
    category: 'PAYMENT_OVERDUE' as MessageTemplateType,
    channel: 'SMS' as MessageChannel,
    template: 'URGENTE: Tu pago de ${monto} MXN esta vencido desde hace {dias} dias. Prestamo #{numero}. Contactanos!',
    variables: 'monto, dias, numero',
    maxLength: 160,
    isActive: true,
  },
  {
    name: 'SMS Préstamo Aprobado',
    description: 'Notificación de préstamo aprobado',
    category: 'LOAN_APPROVED' as MessageTemplateType,
    channel: 'SMS' as MessageChannel,
    template: 'Felicidades! Tu prestamo de ${monto} MXN ha sido aprobado. #{numero}. Te contactaremos pronto.',
    variables: 'monto, numero',
    maxLength: 160,
    isActive: true,
  },

  // WhatsApp Templates (sin límite estricto)
  {
    name: 'WhatsApp Cuenta Creada',
    description: 'Mensaje de bienvenida por WhatsApp',
    category: 'ACCOUNT_CREATED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '¡Hola {nombre}! 👋\n\n¡Bienvenido a EscalaFin! Tu cuenta ha sido creada exitosamente.\n\n📧 Usuario: {email}\n\nEstamos aquí para ayudarte en tu camino financiero. Si tienes alguna pregunta, no dudes en contactarnos.',
    variables: 'nombre, email',
    isActive: true,
  },
  {
    name: 'WhatsApp Pago Recibido',
    description: 'Confirmación de pago por WhatsApp',
    category: 'PAYMENT_RECEIVED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '¡Pago recibido! ✅\n\n💰 Monto: ${monto} MXN\n📝 Préstamo: #{numero}\n📅 Fecha: {fecha}\n\n¡Gracias por tu pago puntual! Tu compromiso nos ayuda a seguir brindándote el mejor servicio.',
    variables: 'monto, numero, fecha',
    isActive: true,
  },
  {
    name: 'WhatsApp Recordatorio de Pago',
    description: 'Recordatorio de pago por WhatsApp',
    category: 'PAYMENT_REMINDER' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '⏰ Recordatorio de Pago\n\nHola {nombre},\n\nTe recordamos que tienes un pago próximo:\n\n💰 Monto: ${monto} MXN\n📅 Fecha de vencimiento: {fecha}\n📝 Préstamo: #{numero}\n\nPuedes realizar tu pago a través de nuestra plataforma o en efectivo. ¡Gracias!',
    variables: 'nombre, monto, fecha, numero',
    isActive: true,
  },
  {
    name: 'WhatsApp Pago Vencido',
    description: 'Notificación de pago vencido por WhatsApp',
    category: 'PAYMENT_OVERDUE' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '⚠️ PAGO VENCIDO\n\nHola {nombre},\n\nTu pago está vencido desde hace {dias} días:\n\n💰 Monto: ${monto} MXN\n📝 Préstamo: #{numero}\n\nPor favor, contacta a tu asesor lo antes posible para regularizar tu situación. Estamos aquí para ayudarte.',
    variables: 'nombre, monto, dias, numero',
    isActive: true,
  },
  {
    name: 'WhatsApp Préstamo Aprobado',
    description: 'Notificación de préstamo aprobado por WhatsApp',
    category: 'LOAN_APPROVED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '🎉 ¡FELICIDADES!\n\nTu préstamo ha sido APROBADO ✅\n\n💰 Monto: ${monto} MXN\n📝 Número de préstamo: #{numero}\n📅 Plazo: {plazo} meses\n💳 Pago mensual: ${pagoMensual} MXN\n\nTu asesor se pondrá en contacto contigo pronto para finalizar el proceso. ¡Gracias por confiar en nosotros!',
    variables: 'monto, numero, plazo, pagoMensual',
    isActive: true,
  },
  {
    name: 'WhatsApp Préstamo Desembolsado',
    description: 'Confirmación de desembolso de préstamo',
    category: 'LOAN_DISBURSED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '✅ PRÉSTAMO DESEMBOLSADO\n\nHola {nombre},\n\n¡Tu préstamo ha sido desembolsado exitosamente!\n\n💰 Monto: ${monto} MXN\n📝 Préstamo: #{numero}\n📅 Primer pago: {fechaPrimerPago}\n💳 Pago mensual: ${pagoMensual} MXN\n\nRevisa tu cuenta bancaria. El dinero debería estar disponible en las próximas horas.',
    variables: 'nombre, monto, numero, fechaPrimerPago, pagoMensual',
    isActive: true,
  },
  {
    name: 'WhatsApp Solicitud Recibida',
    description: 'Confirmación de solicitud de crédito recibida',
    category: 'CREDIT_APPLICATION_RECEIVED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '📋 SOLICITUD RECIBIDA\n\nHola {nombre},\n\nHemos recibido tu solicitud de crédito por ${monto} MXN.\n\n📝 Número de solicitud: #{numero}\n\nNuestro equipo la está revisando. Te contactaremos en las próximas 24-48 horas.\n\n¡Gracias por tu confianza!',
    variables: 'nombre, monto, numero',
    isActive: true,
  },
  {
    name: 'WhatsApp Solicitud Aprobada',
    description: 'Notificación de solicitud de crédito aprobada',
    category: 'CREDIT_APPLICATION_APPROVED' as MessageTemplateType,
    channel: 'WHATSAPP' as MessageChannel,
    template: '✅ SOLICITUD APROBADA\n\nHola {nombre},\n\n¡Excelentes noticias! Tu solicitud de crédito ha sido APROBADA.\n\n💰 Monto aprobado: ${monto} MXN\n📝 Solicitud: #{numero}\n\nTu asesor se pondrá en contacto contigo para los siguientes pasos.',
    variables: 'nombre, monto, numero',
    isActive: true,
  },

  // Chatwoot Templates
  {
    name: 'Chatwoot Bienvenida',
    description: 'Mensaje de bienvenida en Chatwoot',
    category: 'WELCOME' as MessageTemplateType,
    channel: 'CHATWOOT' as MessageChannel,
    template: '¡Hola {nombre}! 👋 Bienvenido a EscalaFin. ¿En qué puedo ayudarte hoy?',
    variables: 'nombre',
    isActive: true,
  },
  {
    name: 'Chatwoot Actualización Préstamo',
    description: 'Notificación de actualización de préstamo en Chatwoot',
    category: 'LOAN_UPDATE' as MessageTemplateType,
    channel: 'CHATWOOT' as MessageChannel,
    template: 'Hola {nombre}, hay una actualización en tu préstamo #{numero}: {mensaje}',
    variables: 'nombre, numero, mensaje',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seeding de plantillas de mensajes...');

  for (const template of defaultTemplates) {
    try {
      const existing = await prisma.messageTemplate.findUnique({
        where: { name: template.name },
      });

      if (existing) {
        console.log(`⏭️  Plantilla "${template.name}" ya existe, actualizando...`);
        await prisma.messageTemplate.update({
          where: { name: template.name },
          data: {
            description: template.description,
            category: template.category,
            channel: template.channel,
            template: template.template,
            variables: template.variables,
            maxLength: template.maxLength,
            isActive: template.isActive,
          },
        });
      } else {
        console.log(`➕ Creando plantilla "${template.name}"...`);
        await prisma.messageTemplate.create({
          data: template,
        });
      }
    } catch (error) {
      console.error(`❌ Error procesando plantilla "${template.name}":`, error);
    }
  }

  console.log('✅ Seeding de plantillas completado!');
}

main()
  .catch((error) => {
    console.error('Error en seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
