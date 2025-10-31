# Implementación de Sistema de Plantillas de Mensajes

**Fecha:** 31 de Octubre 2025
**Versión:** 1.0.0

## Resumen

Sistema completo de plantillas de mensajes para múltiples canales de comunicación con distinción clara entre SMS (LabMobile con límite de 160 caracteres), WhatsApp (sin límite), y Chatwoot (chat en tiempo real).

## Cambios en Base de Datos

### Nuevo Modelo: MessageTemplate

```prisma
model MessageTemplate {
  id          String              @id @default(cuid())
  name        String              @unique
  description String?
  category    MessageTemplateType
  channel     MessageChannel
  template    String
  variables   String?
  maxLength   Int?
  isActive    Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([category])
  @@index([channel])
  @@map("message_templates")
}
```

### Nuevos Enums

#### MessageTemplateType
- ACCOUNT_CREATED
- PAYMENT_RECEIVED
- PAYMENT_REMINDER
- PAYMENT_OVERDUE
- LOAN_APPROVED
- LOAN_DISBURSED
- LOAN_REJECTED
- LOAN_UPDATE
- CREDIT_APPLICATION_RECEIVED
- CREDIT_APPLICATION_APPROVED
- CREDIT_APPLICATION_REJECTED
- WELCOME
- MARKETING
- CUSTOM

#### MessageChannel
- SMS (LabMobile - 160 caracteres)
- WHATSAPP (sin límite)
- CHATWOOT (chat tiempo real)
- EMAIL
- PUSH

## Componentes Creados

### APIs

1. **GET /api/admin/message-templates**
   - Lista todas las plantillas
   - Filtros: channel, category, isActive
   - Solo ADMIN

2. **POST /api/admin/message-templates**
   - Crea nueva plantilla
   - Validación SMS: máximo 160 caracteres
   - Solo ADMIN

3. **GET /api/admin/message-templates/[id]**
   - Obtiene plantilla específica
   - Solo ADMIN

4. **PUT /api/admin/message-templates/[id]**
   - Actualiza plantilla
   - Validación SMS: máximo 160 caracteres
   - Solo ADMIN

5. **DELETE /api/admin/message-templates/[id]**
   - Elimina plantilla
   - Solo ADMIN

### Frontend

1. **`/admin/message-templates`**
   - Gestión completa de plantillas
   - Tabs por canal (SMS, WhatsApp, Chatwoot, Email, Push)
   - Editor con contador de caracteres
   - Validación en tiempo real para SMS

2. **Componente: `MessageTemplatesManagement`**
   - CRUD completo de plantillas
   - Validación automática de límite SMS (160 caracteres)
   - Visualización por canal con iconos
   - Copiar plantilla al portapapeles
   - Gestión de variables dinámicas

### Scripts

1. **`scripts/seed-message-templates.js`**
   - Seeding automático de 15 plantillas predeterminadas
   - 5 plantillas SMS (160 caracteres)
   - 8 plantillas WhatsApp (sin límite)
   - 2 plantillas Chatwoot
   - Ejecutado automáticamente en inicio

2. **`scripts/seed-message-templates.ts`**
   - Versión TypeScript para desarrollo

## Plantillas Predeterminadas

### SMS (LabMobile - 160 caracteres)

1. **SMS Cuenta Creada**
   - "Hola {nombre}, bienvenido a EscalaFin! Tu cuenta ha sido creada. Usuario: {email}"
   - Variables: nombre, email

2. **SMS Pago Recibido**
   - "Pago recibido! ${monto} MXN para prestamo #{numero}. Fecha: {fecha}. Gracias!"
   - Variables: monto, numero, fecha

3. **SMS Recordatorio de Pago**
   - "Recordatorio: Tu pago de ${monto} MXN vence el {fecha}. Prestamo #{numero}."
   - Variables: monto, fecha, numero

4. **SMS Pago Vencido**
   - "URGENTE: Tu pago de ${monto} MXN esta vencido desde hace {dias} dias. Prestamo #{numero}. Contactanos!"
   - Variables: monto, dias, numero

5. **SMS Préstamo Aprobado**
   - "Felicidades! Tu prestamo de ${monto} MXN ha sido aprobado. #{numero}. Te contactaremos pronto."
   - Variables: monto, numero

### WhatsApp (sin límite)

1. **WhatsApp Cuenta Creada**
   - Mensaje de bienvenida con emojis y formato
   - Variables: nombre, email

2. **WhatsApp Pago Recibido**
   - Confirmación detallada con emojis
   - Variables: monto, numero, fecha

3. **WhatsApp Recordatorio de Pago**
   - Recordatorio formateado con detalles completos
   - Variables: nombre, monto, fecha, numero

4. **WhatsApp Pago Vencido**
   - Notificación urgente con detalles
   - Variables: nombre, monto, dias, numero

5. **WhatsApp Préstamo Aprobado**
   - Felicitación con detalles del préstamo
   - Variables: monto, numero, plazo, pagoMensual

6. **WhatsApp Préstamo Desembolsado**
   - Confirmación de desembolso con detalles
   - Variables: nombre, monto, numero, fechaPrimerPago, pagoMensual

7. **WhatsApp Solicitud Recibida**
   - Confirmación de recepción de solicitud
   - Variables: nombre, monto, numero

8. **WhatsApp Solicitud Aprobada**
   - Notificación de aprobación de solicitud
   - Variables: nombre, monto, numero

### Chatwoot

1. **Chatwoot Bienvenida**
   - "¡Hola {nombre}! 👋 Bienvenido a EscalaFin. ¿En qué puedo ayudarte hoy?"
   - Variables: nombre

2. **Chatwoot Actualización Préstamo**
   - "Hola {nombre}, hay una actualización en tu préstamo #{numero}: {mensaje}"
   - Variables: nombre, numero, mensaje

## Características Técnicas

### Validaciones

1. **SMS (LabMobile)**
   - Límite estricto: 160 caracteres
   - Validación en frontend y backend
   - Contador en tiempo real
   - maxLength automático: 160

2. **WhatsApp**
   - Sin límite estricto de caracteres
   - Soporte de emojis
   - Soporte de formato (saltos de línea)

3. **Chatwoot**
   - Chat en tiempo real
   - Sin límite de caracteres
   - Integración con widget

### Variables Dinámicas

Sistema de reemplazo de variables con sintaxis `{variable}`:

- `{nombre}` - Nombre del cliente
- `{email}` - Email
- `{monto}` - Monto en MXN
- `{numero}` - Número de préstamo/solicitud
- `{fecha}` - Fecha
- `{dias}` - Días de atraso
- `{plazo}` - Plazo en meses
- `{pagoMensual}` - Pago mensual
- `{fechaPrimerPago}` - Fecha del primer pago
- `{mensaje}` - Mensaje personalizado

## Navegación

### Menú Admin

**Sección:** Notificaciones
- Centro de Notificaciones
- **Plantillas de Mensajes** (nuevo)

**Ruta:** `/admin/message-templates`
**Icono:** Mail (lucide-react)
**ModuleKey:** `notifications_templates`

## Inicialización Automática

Las plantillas se sincronizan automáticamente al iniciar el contenedor:

1. `start-improved.sh` ejecuta `scripts/seed-message-templates.js`
2. Crea o actualiza las 15 plantillas predeterminadas
3. No afecta plantillas personalizadas existentes

## Diferencias entre Canales

### SMS (LabMobile)
- ✅ Límite: 160 caracteres (estricto)
- ✅ Alta tasa apertura (98%)
- ✅ Ideal para notificaciones urgentes
- ⚠️ Costo por mensaje
- ⚠️ Sin formato enriquecido
- ⚠️ Sin emojis complejos

### WhatsApp
- ✅ Sin límite de caracteres
- ✅ Formato enriquecido (negrita, emojis)
- ✅ Puede incluir media (imágenes, documentos)
- ✅ Ideal para mensajes detallados
- ✅ Mayor engagement

### Chatwoot
- ✅ Chat en tiempo real
- ✅ Historial completo
- ✅ Ideal para soporte interactivo
- ✅ Integración multicanal
- ✅ Sin costo adicional

## Uso Programático

```typescript
// Obtener plantilla por nombre
const template = await prisma.messageTemplate.findUnique({
  where: { name: 'SMS Pago Recibido' }
});

// Reemplazar variables
let message = template.template;
message = message.replace('{monto}', '5000');
message = message.replace('{numero}', 'L12345');
message = message.replace('{fecha}', '31/10/2025');

// Validar longitud para SMS
if (template.channel === 'SMS' && message.length > 160) {
  throw new Error('Mensaje SMS excede 160 caracteres');
}

// Enviar mensaje (según canal)
await sendSMS(clientPhone, message);
// o
await sendWhatsApp(clientPhone, message);
// o
await sendChatwoot(clientId, message);
```

## Estado del Proyecto

- ✅ Modelo de BD creado y migrado
- ✅ APIs CRUD completas
- ✅ Frontend de administración completo
- ✅ Seeding automático implementado
- ✅ Validaciones SMS activas
- ✅ Menú actualizado
- ✅ 15 plantillas predeterminadas
- ⏳ Integración con sistema de envío (próximo)
- ⏳ Historial de mensajes enviados (próximo)

## Próximos Pasos

1. Integrar plantillas con `WhatsAppNotificationService`
2. Crear endpoint para renderizar plantillas con variables
3. Implementar historial de mensajes enviados
4. Dashboard de estadísticas por plantilla
5. Integración con LabMobile SMS API
6. A/B testing de plantillas

## Notas Técnicas

- Prisma Client regenerado con nuevos modelos
- Base de datos sincronizada con `prisma db push`
- No requiere migración manual
- Compatible con sistema de módulos PWA existente
- No afecta funcionalidad actual de notificaciones
