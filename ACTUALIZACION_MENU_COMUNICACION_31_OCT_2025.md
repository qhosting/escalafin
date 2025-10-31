# Actualización del Menú de Comunicación - 31 Octubre 2025

## Cambios Realizados

### 1. Actualización del Menú de Navegación

Se agregaron los submenús faltantes en la sección "Comunicación" para los tres roles:

#### ADMIN:
- **WhatsApp**
  - Mensajes (`/admin/whatsapp/messages`)
  - Recargas (`/admin/message-recharges`)
- **Chat**
  - Chatwoot (`/admin/chatwoot`)
- **SMS** ⭐ NUEVO
  - LabsMobile (`/admin/sms`)
- **Notificaciones**
  - Centro de Notificaciones (`/notifications`)
  - Plantillas de Mensajes (`/admin/message-templates`)

#### ASESOR:
- **WhatsApp**
  - Mensajes (`/admin/whatsapp/messages`)
- **Chat** ⭐ NUEVO
  - Chatwoot (`/admin/chatwoot`)
- **SMS** ⭐ NUEVO
  - LabsMobile (`/admin/sms`)
- **Notificaciones**
  - Centro de Notificaciones (`/notifications`)
  - Plantillas de Mensajes (`/admin/message-templates`)

#### CLIENTE:
- **Chat** ⭐ NUEVO
  - Chatwoot (`/admin/chatwoot`)
- **Notificaciones**
  - Centro de Notificaciones (`/notifications`)
  - Plantillas de Mensajes (`/admin/message-templates`)

### 2. Corrección de ModuleKeys

Se corrigió el moduleKey para LabsMobile:
- **Antes:** `sms_notifications`
- **Ahora:** `labsmobile_sms`

Este cambio asegura que el módulo se habilite/deshabilite correctamente según la configuración en la base de datos.

### 3. Corrección de API Routes

Se movió el endpoint de recargas de mensajes a la ubicación correcta:
- **De:** `api/admin/message-recharges/route.ts`
- **A:** `app/api/admin/message-recharges/route.ts`

Esto corrige el problema de enlaces rotos en la estructura de Next.js App Router.

## Verificación Realizada

### ✅ Rutas de Página
Todas las rutas del menú existen y son accesibles:
- `/admin/whatsapp/messages`
- `/admin/message-recharges`
- `/admin/chatwoot`
- `/admin/sms`
- `/notifications`
- `/admin/message-templates`

### ✅ Componentes
Todos los componentes necesarios existen:
- `components/admin/chatwoot-config.tsx`
- `components/admin/labsmobile-config.tsx`
- `components/admin/message-templates-management.tsx`
- `components/admin/whatsapp-messages-dashboard.tsx`
- `components/chatwoot/chatwoot-widget.tsx`

### ✅ Librerías
Todas las librerías de integración existen:
- `lib/chatwoot.ts`
- `lib/labsmobile.ts`
- `lib/evolution-api.ts`
- `lib/whatsapp-notification.ts`

### ✅ APIs
Todos los endpoints de API están correctamente ubicados:
- `app/api/admin/chatwoot/config/route.ts`
- `app/api/admin/chatwoot/test/route.ts`
- `app/api/admin/message-recharges/route.ts`
- `app/api/admin/message-recharges/[id]/route.ts`
- `app/api/admin/message-templates/route.ts`

## Módulos en Base de Datos

Los siguientes módulos deben estar habilitados en la base de datos:

| ModuleKey | Nombre | Categoría | Estado |
|-----------|--------|-----------|--------|
| `whatsapp_notifications` | Notificaciones WhatsApp | NOTIFICATIONS | ENABLED |
| `chatwoot_chat` | Chatwoot | INTEGRATIONS | ENABLED |
| `labsmobile_sms` | LabsMobile SMS | NOTIFICATIONS | ENABLED |
| `notifications_inapp` | Notificaciones In-App | NOTIFICATIONS | ENABLED |
| `notifications_templates` | Plantillas de Mensajes | NOTIFICATIONS | ENABLED |

## Verificación de Estado

Para verificar que los módulos están correctamente configurados:

```bash
cd /home/ubuntu/escalafin_mvp/app
yarn tsx scripts/seed-modules.ts
```

Esto sincronizará los módulos en la base de datos con la configuración actual.

## Estado Final

✅ **Menú de Comunicación actualizado con todos los submenús**
✅ **ModuleKeys corregidos**
✅ **API Routes en ubicación correcta**
✅ **No se encontraron enlaces rotos**
✅ **Todos los componentes y librerías existen**

## Archivos Modificados

1. `app/components/layout/desktop-navbar.tsx` - Actualizado con nuevos submenús
2. `app/api/admin/message-recharges/` - Movido a ubicación correcta

## Próximos Pasos

1. **Desplegar los cambios** en el entorno de producción
2. **Verificar en UI** que todos los submenús se visualicen correctamente
3. **Probar la funcionalidad** de cada módulo:
   - Chatwoot: Verificar que el widget se cargue
   - LabsMobile: Probar envío de SMS
   - Plantillas: Verificar CRUD de plantillas
4. **Ejecutar seed de módulos** si algún módulo no se visualiza

---

**Fecha:** 31 de Octubre de 2025
**Versión:** 1.3.0
**Estado:** ✅ Completado
