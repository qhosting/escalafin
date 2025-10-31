
# Implementación de LabsMobile SMS API
**Fecha:** 31 de Octubre 2025  
**Sistema:** EscalaFin MVP - Gestión de Préstamos y Créditos

---

## 📋 Resumen de Implementación

Se ha implementado completamente el servicio de envío de SMS a través de LabsMobile API con las siguientes características:

### ✅ Componentes Implementados

#### 1. **Servicio de LabsMobile**
- **Archivo:** `/app/lib/labsmobile.ts`
- **Funcionalidades:**
  - Envío de SMS individual y masivo
  - Validación de configuración
  - Formateo automático de números telefónicos
  - Truncado automático de mensajes a 160 caracteres
  - Consulta de créditos disponibles
  - Generación de mensajes predefinidos

#### 2. **Interfaz de Configuración**
- **Componente:** `/app/components/admin/labsmobile-config.tsx`
- **Página:** `/app/app/admin/sms/page.tsx`
- **Características:**
  - Configuración de credenciales (Username, API Token)
  - Configuración de Sender ID (hasta 11 caracteres)
  - Habilitación/deshabilitación del servicio
  - Consulta de créditos en tiempo real
  - Prueba de envío de SMS

#### 3. **API Endpoints**
- **Configuración:** `/app/api/admin/settings/route.ts` (actualizado)
- **Créditos:** `/app/api/admin/settings/labsmobile/credits/route.ts`
- **Pruebas:** `/app/api/admin/settings/labsmobile/test/route.ts`

#### 4. **Módulo PWA**
- **Clave:** `labsmobile_sms`
- **Nombre:** LabsMobile SMS
- **Categoría:** INTEGRATIONS
- **Ruta:** `/admin/sms`
- **Disponible para:** ADMIN

---

## 🔧 Configuración

### Variables de Entorno (Opcionales)
```env
LABSMOBILE_USERNAME=tu-usuario
LABSMOBILE_API_TOKEN=tu-api-token
LABSMOBILE_SENDER=EscalaFin
```

### Configuración desde la Interfaz
1. Acceder a `/admin/sms`
2. Ingresar credenciales de LabsMobile:
   - **Username:** Tu usuario de LabsMobile
   - **API Token:** Token de API generado en el panel de LabsMobile
   - **Sender ID:** Nombre del remitente (máx. 11 caracteres)
3. Habilitar el servicio
4. Probar la conexión

### Obtener Credenciales de LabsMobile
1. Ir a https://www.labsmobile.com
2. Iniciar sesión en tu cuenta
3. Navegar a **API** → **Configuración**
4. Copiar tu **Username** y **API Token**

---

## 📱 Características del Servicio

### Límite de Caracteres
- **SMS estándar:** 160 caracteres máximo
- **Truncado automático:** Los mensajes más largos se truncan a 157 caracteres + "..."

### Formateo de Números
- **Formato esperado:** +52XXXXXXXXXX (México)
- **Formateo automático:** El servicio agrega el código de país automáticamente si no está presente

### Mensajes Predefinidos
El servicio incluye generadores de mensajes predefinidos:
1. **Pago Recibido**
   ```typescript
   LabsMobileService.generatePaymentReceivedSMS(clientName, amount, loanNumber)
   ```

2. **Recordatorio de Pago**
   ```typescript
   LabsMobileService.generatePaymentReminderSMS(clientName, amount, dueDate)
   ```

3. **Pago Vencido**
   ```typescript
   LabsMobileService.generateOverduePaymentSMS(clientName, daysOverdue, amount)
   ```

4. **Préstamo Aprobado**
   ```typescript
   LabsMobileService.generateLoanApprovedSMS(clientName, amount)
   ```

---

## 🔌 Uso del Servicio

### Ejemplo Básico
```typescript
import LabsMobileService from '@/lib/labsmobile';

const labsmobile = new LabsMobileService();

// Enviar SMS individual
const result = await labsmobile.sendSMS({
  recipient: '+5215512345678',
  message: 'Tu mensaje aquí',
  sender: 'EscalaFin' // Opcional
});

if (result.success) {
  console.log('SMS enviado. Créditos restantes:', result.remainingCredits);
} else {
  console.error('Error:', result.error);
}
```

### Envío Masivo
```typescript
const messages = [
  { recipient: '+5215512345678', message: 'Mensaje 1' },
  { recipient: '+5215512345679', message: 'Mensaje 2' }
];

const results = await labsmobile.sendBulkSMS(messages);
```

### Consultar Créditos
```typescript
const credits = await labsmobile.getCredits();
console.log('Créditos disponibles:', credits);
```

---

## 🔀 Diferencias entre Chatwoot y LabsMobile

| Aspecto | Chatwoot | LabsMobile SMS |
|---------|----------|----------------|
| **Tipo** | Chat en tiempo real | Mensajería SMS |
| **Canal** | Widget de chat en sitio web | SMS a teléfonos móviles |
| **Límite de caracteres** | Sin límite práctico | 160 caracteres estricto |
| **Interactividad** | Conversación bidireccional | Mensaje unidireccional |
| **Requiere internet** | Sí | No |
| **Costo** | Por configuración/uso | Por crédito/mensaje |
| **Uso principal** | Soporte al cliente | Notificaciones urgentes |

---

## 📊 API de LabsMobile

### Endpoint Base
```
https://api.labsmobile.com/json/send
```

### Estructura de Petición
```json
{
  "username": "tu-usuario",
  "password": "tu-api-token",
  "sender": "EscalaFin",
  "message": "Tu mensaje",
  "recipient": [{
    "msisdn": "+5215512345678"
  }]
}
```

### Códigos de Respuesta
- **0:** Éxito
- **100:** Formato de número inválido
- **101:** No hay suficientes créditos
- **102:** Error de autenticación

---

## 🎯 Casos de Uso

### 1. Notificaciones de Pago
```typescript
// Cuando se recibe un pago
const message = LabsMobileService.generatePaymentReceivedSMS(
  'Juan Pérez',
  1500.00,
  'PR-2025-001'
);

await labsmobile.sendSMS({
  recipient: client.phone,
  message
});
```

### 2. Recordatorios Automáticos
```typescript
// Recordar próximo pago
const message = LabsMobileService.generatePaymentReminderSMS(
  'María González',
  2000.00,
  new Date('2025-11-05')
);

await labsmobile.sendSMS({
  recipient: client.phone,
  message
});
```

### 3. Alertas de Mora
```typescript
// Notificar pagos vencidos
const message = LabsMobileService.generateOverduePaymentSMS(
  'Carlos Ruiz',
  5,
  1500.00
);

await labsmobile.sendSMS({
  recipient: client.phone,
  message
});
```

---

## 🔒 Seguridad

1. **Credenciales encriptadas:** Se almacenan en `system-settings.json`
2. **Acceso restringido:** Solo usuarios ADMIN pueden configurar
3. **Validación de entrada:** Números y mensajes validados antes de envío
4. **Rate limiting:** Pausa de 100ms entre mensajes en envíos masivos

---

## 🐛 Solución de Problemas

### Error de Autenticación
- Verificar Username y API Token en configuración
- Confirmar que las credenciales sean válidas en labsmobile.com

### SMS no recibido
- Verificar formato del número de teléfono
- Confirmar que hay créditos disponibles
- Revisar logs del servidor para errores

### Truncado de Mensajes
- Los mensajes se truncan automáticamente a 160 caracteres
- Usar mensajes concisos y directos
- Utilizar los generadores predefinidos cuando sea posible

---

## 📝 Archivos Modificados

1. **Nuevos:**
   - `/app/lib/labsmobile.ts`
   - `/app/components/admin/labsmobile-config.tsx`
   - `/app/app/admin/sms/page.tsx`
   - `/app/api/admin/settings/labsmobile/credits/route.ts`
   - `/app/api/admin/settings/labsmobile/test/route.ts`

2. **Actualizados:**
   - `/app/api/admin/settings/route.ts` (soporte para categorías)
   - `/app/scripts/seed-modules.js` (módulo labsmobile_sms)

---

## ✨ Próximos Pasos

1. **Integración con Notificaciones:**
   - Conectar con el sistema de notificaciones existente
   - Configurar envío automático según preferencias del cliente

2. **Plantillas de Mensajes:**
   - Vincular con el sistema de plantillas de mensajes
   - Permitir personalización de mensajes SMS

3. **Estadísticas:**
   - Dashboard de SMS enviados
   - Métricas de entrega y costos

4. **Automatización:**
   - Envío programado de recordatorios
   - Alertas automáticas de mora

---

## 📞 Donde Configurar LabsMobile

### Ruta de Acceso
**URL:** `/admin/sms`

### Navegación en el Sistema
1. Iniciar sesión como ADMIN
2. Ir al menú lateral
3. Sección **Integraciones**
4. Seleccionar **LabsMobile SMS**

### Credenciales Necesarias
- Username de LabsMobile
- API Token de LabsMobile
- Sender ID (opcional, por defecto: EscalaFin)

---

## ✅ Estado Actual

- ✅ Servicio de LabsMobile implementado
- ✅ API endpoints creados
- ✅ Interfaz de configuración completa
- ✅ Módulo PWA registrado
- ✅ Pruebas de envío disponibles
- ✅ Documentación completa

**El sistema está listo para usar. Solo falta configurar las credenciales de LabsMobile.**

---

*Documentación generada el 31 de Octubre 2025*
