
# Changelog - Integración Chatwoot

## [2.1.0] - 2025-10-29

### 🎉 Añadido
- **Widget de Chatwoot:** Sistema de chat en tiempo real integrado en toda la aplicación
- **Identificación automática:** Los usuarios autenticados se identifican automáticamente en Chatwoot
- **Panel de Admin:** Nueva página `/admin/chatwoot` para gestión de configuración
- **API Endpoints:** 
  - `GET /api/admin/chatwoot/config` - Obtener configuración
  - `POST /api/admin/chatwoot/config` - Actualizar configuración
  - `GET /api/admin/chatwoot/test` - Probar conexión
- **Hook personalizado:** `useChatwoot()` para controlar el widget desde componentes React
- **Librería de API:** Cliente completo de Chatwoot con métodos para conversaciones, contactos y mensajes

### 📁 Archivos Nuevos
```
app/
├── lib/
│   └── chatwoot.ts                                    # Cliente de API
├── components/
│   ├── chatwoot/
│   │   └── chatwoot-widget.tsx                       # Componente de widget
│   └── admin/
│       └── chatwoot-config.tsx                       # Panel de configuración
├── hooks/
│   └── use-chatwoot.ts                               # Hook de React
└── app/
    ├── api/
    │   └── admin/
    │       └── chatwoot/
    │           ├── config/
    │           │   └── route.ts                      # API de configuración
    │           └── test/
    │               └── route.ts                      # API de prueba
    └── admin/
        └── chatwoot/
            └── page.tsx                              # Página de admin
```

### 🔧 Archivos Modificados
- `app/app/layout.tsx` - Agregado widget de Chatwoot
- `app/components/layout/desktop-navbar.tsx` - Agregado enlace "Chat (Chatwoot)"
- `app/.env` - Agregadas variables de entorno de Chatwoot

### 🎯 Variables de Entorno
```bash
CHATWOOT_BASE_URL=https://chat.whatscloud.siet
CHATWOOT_WEBSITE_TOKEN=jnJFd3e9FVkotBYoJ6Rgdjyk
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_API_ACCESS_TOKEN=59sqgytog1omHFmToDUTXoJF
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=jnJFd3e9FVkotBYoJ6Rgdjyk
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.whatscloud.siet
```

### ✨ Características
- Widget de chat flotante en todas las páginas
- Identificación automática de usuarios con role y userId
- Panel de administración con:
  - Estado de configuración
  - Prueba de conexión
  - Características activas
  - Enlace al panel de Chatwoot
- API segura con autenticación de admin
- Hook de React con métodos para:
  - Abrir/cerrar chat
  - Establecer atributos personalizados
  - Gestión de etiquetas
  - Cambio de idioma

### 🚀 Mejoras
- Integración seamless con sistema de autenticación existente
- Carga asíncrona del widget para no bloquear página
- Manejo robusto de errores
- Logging detallado para debugging

### 📊 Impacto
- **Rutas nuevas:** +1 (`/admin/chatwoot`)
- **API endpoints nuevos:** +2
- **Módulos activos:** 19 (18 anteriores + Chatwoot)
- **Build:** ✅ Exitoso (58 rutas generadas)

### 🔒 Seguridad
- Tokens sensibles no se exponen en frontend
- Endpoints de admin requieren autenticación
- Validación de roles para acceso a configuración

### 📱 Compatibilidad
- Desktop: ✅ Completamente funcional
- Mobile: ✅ Responsive y touch-friendly
- PWA: ✅ Funciona en modo offline (con limitaciones)

### 🐛 Problemas Conocidos
- Warning durante build sobre renderizado estático en `/api/admin/chatwoot/test`
  - **Impacto:** Ninguno, solo advertencia
  - **Razón:** Uso de `headers` en API route
  - **Solución:** No requiere acción, comportamiento esperado

### 📝 Notas de Migración
No se requieren migraciones de base de datos. La integración es completamente nueva y no afecta funcionalidades existentes.

### 🧪 Testing
- ✅ Build exitoso
- ✅ Widget se carga correctamente
- ✅ Identificación de usuarios funciona
- ✅ API endpoints responden correctamente
- ✅ Panel de admin accesible y funcional

### 👥 Usuarios Afectados
- **ADMIN:** Acceso completo a widget y panel de configuración
- **ASESOR:** Acceso a widget de chat
- **CLIENTE:** Acceso a widget de chat

---

## Comparación con Versión Anterior

### Antes (v2.0.0)
- 18 módulos activos
- Sistema de notificaciones interno únicamente
- Sin chat en tiempo real

### Después (v2.1.0)
- 19 módulos activos
- Sistema de notificaciones interno + Chatwoot
- Chat en tiempo real con identificación automática

---

## Dependencias

No se agregaron nuevas dependencias npm. La integración usa el SDK de Chatwoot cargado dinámicamente desde su CDN.

---

## Próximos Pasos

1. Deploy en EasyPanel
2. Verificación en producción
3. Training de equipo de soporte
4. Configuración de agentes en Chatwoot
5. Personalización de mensajes de bienvenida

---

**Autor:** DeepAgent  
**Fecha:** 29 de Octubre de 2025  
**Versión:** 2.1.0
