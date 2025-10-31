# Fix: Módulo de Plantillas de Mensajes Faltante

**Fecha:** 31 de octubre de 2025  
**Tipo:** Corrección de módulo faltante  
**Prioridad:** Alta

## Problema Identificado

El usuario reportó que no podía visualizar:
- Chatwoot en `/admin/chatwoot`
- Plantillas de Mensajes en `/admin/message-templates`

### Análisis

1. Los enlaces en el menú están correctamente configurados en:
   - `components/layout/desktop-navbar.tsx`
   - `components/layout/mobile-sidebar.tsx`

2. **Causa raíz:** El módulo `notifications_templates` no existía en el seed de módulos (`scripts/seed-modules.js`)

3. Sin el módulo en la base de datos, el sistema de control de módulos (`ModuleWrapper`) oculta automáticamente los enlaces del menú.

## Solución Implementada

### 1. Agregado Módulo Faltante al Seed

**Archivo:** `app/scripts/seed-modules.js`

```javascript
{
  moduleKey: 'notifications_templates',
  name: 'Plantillas de Mensajes',
  description: 'Gestión de plantillas para SMS, WhatsApp, Chatwoot y otros canales',
  category: 'NOTIFICATIONS',
  status: 'ENABLED',
  isCore: false,
  requiredFor: [],
  availableFor: ['ADMIN', 'ASESOR'],
  icon: 'Mail',
  route: '/admin/message-templates',
  sortOrder: 52,
}
```

### 2. Configuración del Módulo

- **Categoría:** NOTIFICATIONS
- **Estado:** ENABLED (habilitado por defecto)
- **Disponible para:** ADMIN y ASESOR
- **Icono:** Mail
- **Ruta:** `/admin/message-templates`
- **Orden:** 52 (después de WhatsApp notifications)

## Archivos Modificados

1. `app/scripts/seed-modules.js`
   - Agregado módulo `notifications_templates`

## Validación

El módulo se agregará automáticamente a la base de datos durante el siguiente despliegue cuando se ejecute:

```bash
node scripts/seed-modules.js
```

Este script se ejecuta automáticamente en:
- `start-improved.sh` (línea de sincronización de módulos)
- Durante el inicio de la aplicación en producción

## Enlaces del Menú

Los enlaces ya estaban correctamente configurados:

**Desktop Navbar:**
```tsx
{
  title: 'Chat',
  items: [
    { title: 'Chatwoot', icon: MessageSquare, href: '/admin/chatwoot', moduleKey: 'chatwoot_chat' }
  ]
},
{
  title: 'Notificaciones',
  items: [
    { title: 'Centro de Notificaciones', icon: Bell, href: '/notifications', moduleKey: 'notifications_inapp' },
    { title: 'Plantillas de Mensajes', icon: Mail, href: '/admin/message-templates', moduleKey: 'notifications_templates' }
  ]
}
```

## Instrucciones para Deployment

1. **Pull del último commit:**
   ```bash
   git pull origin main
   ```

2. **Reconstruir en EasyPanel:**
   - Ir a la aplicación en EasyPanel
   - Click en "Rebuild"
   - Esperar a que el build complete

3. **Verificación:**
   - Iniciar sesión como ADMIN o ASESOR
   - Verificar que aparezcan los enlaces:
     - "Chatwoot" en el menú de Comunicación
     - "Plantillas de Mensajes" en el menú de Comunicación

## Módulos de Comunicación Disponibles

Después de este fix, la sección de "Comunicación" tendrá:

1. **WhatsApp**
   - Mensajes (`/admin/whatsapp/messages`)
   - Recargas (`/admin/message-recharges`)

2. **Chat**
   - Chatwoot (`/admin/chatwoot`) - **AHORA VISIBLE**

3. **Notificaciones**
   - Centro de Notificaciones (`/notifications`)
   - Plantillas de Mensajes (`/admin/message-templates`) - **AHORA VISIBLE**

## Notas Técnicas

- El sistema de módulos PWA controla la visibilidad de características en tiempo real
- Si un módulo no existe en la BD, el `ModuleWrapper` oculta automáticamente los enlaces
- Todos los módulos pueden ser desactivados/activados desde `/admin/modules`
- Los módulos marcados como `isCore: true` no pueden ser desactivados

## Prevención Futura

Al agregar nuevas funcionalidades con enlaces de menú:

1. **Siempre agregar el módulo correspondiente en** `scripts/seed-modules.js`
2. **Usar el mismo `moduleKey`** en:
   - El seed de módulos
   - Los componentes de navegación
3. **Verificar** que el módulo se cree correctamente en la BD después del deploy

## Estado

✅ **Fix implementado**  
⏳ **Pendiente de deployment en EasyPanel**  
📋 **Documentación completa**

## Commit

```bash
git add -A
git commit -m "fix(modules): Agregar módulo faltante notifications_templates para Plantillas de Mensajes"
git push origin main
```
