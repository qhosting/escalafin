# 🚀 Plan de Implementación SaaS - EscalaFin

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen de Implementación

Este documento describe la implementación completa de las funcionalidades SaaS para EscalaFin.

### ✅ Fase 1: Fundamentos SaaS (COMPLETADO)

| Componente | Estado | Archivo/Ubicación |
|------------|--------|-------------------|
| Modelos de Billing (Plan, Subscription, Invoice) | ✅ | `prisma/schema.prisma` |
| Sistema de límites y uso (TenantUsage) | ✅ | `prisma/schema.prisma` |
| API Keys para integraciones | ✅ | `lib/api-keys.ts` |
| Webhooks configurables | ✅ | `lib/webhooks.ts` |
| Tenant-db completado (todos los modelos) | ✅ | `lib/tenant-db.ts` |
| Middleware de límites por plan | ✅ | `lib/billing/limits.ts` |
| Servicios de billing | ✅ | `lib/billing/*.ts` |
| API Routes de billing | ✅ | `api/billing/*` |

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

```
app/
├── lib/
│   ├── billing/
│   │   ├── index.ts           # Exports del módulo
│   │   ├── plans.ts           # Servicio de planes
│   │   ├── subscriptions.ts   # Gestión de suscripciones
│   │   ├── usage-tracker.ts   # Tracking de uso
│   │   └── limits.ts          # Verificación de límites
│   ├── api-keys.ts            # Gestión de API keys
│   └── webhooks.ts            # Sistema de webhooks
│
├── app/api/
│   ├── billing/
│   │   ├── plans/route.ts
│   │   ├── subscription/route.ts
│   │   └── usage/route.ts
│   ├── api-keys/route.ts
│   └── webhooks/endpoints/route.ts
│
└── scripts/
    ├── seed-plans.ts          # Seed de planes iniciales
    └── migrate-to-saas.ts     # Migración de tenants existentes
```

### Archivos Modificados

- `prisma/schema.prisma` - Modelos SaaS agregados
- `lib/tenant-db.ts` - Cobertura completa de modelos
- `lib/redis-cache.ts` - Métodos adicionales para tracking

---

## 🔧 Instrucciones de Instalación

### 1. Generar migraciones de Prisma

```bash
cd app
npx prisma generate
npx prisma db push
# O para crear una migración formal:
# npx prisma migrate dev --name add_saas_models
```

### 2. Sembrar los planes iniciales

```bash
cd app
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-plans.ts
```

### 3. Migrar tenants existentes a SaaS

```bash
cd app
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-to-saas.ts
```

---

## 📊 API Endpoints Disponibles

### Billing - Planes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/billing/plans` | Lista planes disponibles |

### Billing - Suscripción

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/billing/subscription` | Obtiene suscripción actual |
| PUT | `/api/billing/subscription` | Cambia el plan |
| DELETE | `/api/billing/subscription` | Cancela suscripción |

### Billing - Uso

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/billing/usage` | Obtiene uso y límites |
| GET | `/api/billing/usage?history=true` | Con historial |
| POST | `/api/billing/usage` | Recalcula uso (admin) |

### API Keys

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/api-keys` | Lista API keys |
| POST | `/api/api-keys` | Crea nueva API key |
| DELETE | `/api/api-keys?id=xxx` | Elimina API key |

### Webhooks

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/webhooks/endpoints` | Lista endpoints |
| POST | `/api/webhooks/endpoints` | Crea nuevo endpoint |
| DELETE | `/api/webhooks/endpoints?id=xxx` | Elimina endpoint |

---

## 💰 Planes Configurados

| Plan | Precio/mes | Usuarios | Préstamos | API |
|------|------------|----------|-----------|-----|
| **Starter** | $499 MXN | 3 | 100 | ❌ |
| **Professional** | $1,499 MXN | 10 | 500 | ✅ |
| **Business** | $3,999 MXN | 25 | 2,000 | ✅ |
| **Enterprise** | Custom | Ilimitado | Ilimitado | ✅ |
| **Legacy** | Gratis | Ilimitado | Ilimitado | ✅ |

---

## 🔒 Scopes de API Keys

```typescript
// Clientes
'read:clients'    // Leer información de clientes
'write:clients'   // Crear y modificar clientes
'delete:clients'  // Eliminar clientes

// Préstamos
'read:loans'      // Leer información de préstamos
'write:loans'     // Crear y modificar préstamos

// Pagos
'read:payments'   // Leer información de pagos
'write:payments'  // Registrar pagos

// Reportes
'read:reports'    // Generar y leer reportes

// Webhooks
'manage:webhooks' // Gestionar configuración de webhooks

// Full access
'full:access'     // Acceso completo a todos los recursos
```

---

## 📡 Eventos de Webhook

```typescript
// Clientes
'client.created'
'client.updated'
'client.deleted'

// Préstamos
'loan.created'
'loan.approved'
'loan.disbursed'
'loan.paid_off'
'loan.defaulted'

// Pagos
'payment.created'
'payment.completed'
'payment.failed'

// Solicitudes
'application.submitted'
'application.approved'
'application.rejected'

// Billing
'subscription.created'
'subscription.updated'
'subscription.canceled'
'invoice.created'
'invoice.paid'
```

---

## 🔧 Uso en Código

### Verificar límites antes de crear recursos

```typescript
import { LimitsService } from '@/lib/billing/limits';

// En un API route
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Verificar límite de clientes
  const limitResponse = await LimitsService.middleware(
    session.user.tenantId,
    'clients'
  );
  
  if (limitResponse) {
    return limitResponse; // Retorna 402 si excede límite
  }
  
  // Continuar con la creación...
}
```

### Trackear uso de recursos

```typescript
import { UsageTracker } from '@/lib/billing/usage-tracker';

// Después de crear un préstamo
await UsageTracker.incrementUsage(tenantId, 'loansCount');

// Después de enviar WhatsApp
await UsageTracker.incrementUsage(tenantId, 'whatsappCount');

// Trackear llamada a la API
await UsageTracker.trackApiCall(tenantId);
```

### Disparar webhooks

```typescript
import { WebhooksService } from '@/lib/webhooks';

// Después de crear un pago
await WebhooksService.dispatch(tenantId, 'payment.created', {
  paymentId: payment.id,
  amount: payment.amount,
  loanId: payment.loanId
});
```

### Validar API key en requests externos

```typescript
import { ApiKeysService } from '@/lib/api-keys';

// En un middleware o API route
const apiKey = request.headers.get('X-API-Key');
const validated = await ApiKeysService.validateApiKey(apiKey);

if (!validated) {
  return NextResponse.json({ error: 'API key inválida' }, { status: 401 });
}

// Verificar si tiene el scope necesario
if (!ApiKeysService.hasScope(validated, 'write:payments')) {
  return NextResponse.json({ error: 'Scope insuficiente' }, { status: 403 });
}
```

---

## 🚧 Pendientes para Fase 2

### Prioridad Alta
- [ ] Integración con Stripe para pagos automáticos
- [ ] Portal de pagos para tenants
- [ ] Generación automática de facturas
- [ ] Emails de notificación de límites

### Prioridad Media
- [ ] Dashboard de Super Admin para gestión de tenants
- [ ] Métricas de uso en tiempo real
- [ ] Sistema de cupones/descuentos
- [ ] Upgrades/downgrades prorrateados

### Prioridad Baja
- [ ] API pública documentada con OpenAPI
- [ ] SDK para clientes externos
- [ ] Integración con Zapier/Make

---

## 📝 Notas de Implementación

1. **Plan Legacy**: Los tenants existentes reciben automáticamente el plan Legacy que tiene todos los límites deshabilitados (ilimitado). Esto asegura que no se interrumpa el servicio existente.

2. **Trials**: Los nuevos tenants comienzan con un trial de 14 días del plan seleccionado. Después del trial, la suscripción pasa a estado `PAST_DUE` hasta que se registre un pago.

3. **Rate Limiting de API**: Las API keys tienen su propio rate limiting configurado por la propiedad `rateLimit`. Por defecto es 1,000 requests/minuto.

4. **Webhooks**: Los webhooks usan firma HMAC-SHA256 para verificación. Los endpoints que fallen 10 veces consecutivas se desactivan automáticamente.

5. **Cache**: El tracking de uso utiliza Redis para contadores en tiempo real y evitar sobrecargar la base de datos.

---

## ✅ Verificación Post-Implementación

```bash
# 1. Verificar que la migración de Prisma fue exitosa
npx prisma studio

# 2. Verificar planes sembrados
curl http://localhost:3000/api/billing/plans

# 3. Verificar suscripción de un tenant
curl -H "Cookie: ..." http://localhost:3000/api/billing/subscription

# 4. Verificar uso
curl -H "Cookie: ..." http://localhost:3000/api/billing/usage
```

---

**Última actualización:** Febrero 2026
