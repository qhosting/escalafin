
# Changelog - EscalaFin MVP

Todos los cambios notables de este proyecto serán documentados en este archivo.


## [2.8.0] - 2026-04-05

### 🚀 Fixed - CRÍTICO
- **MiddleWare ReferenceError**: Corregido error fatal en `app/middleware.ts` donde `isLocalhost` se usaba antes de ser definido. Este error causaba la **pantalla en blanco** generalizada en toda la aplicación.
- **Node Engine Compatibility**: Sincronizada configuración de Docker y NPM para evitar errores de motor de Node v18/v20.

### ✨ Added - SaaS & multi-tenancy
- **Tenant Management**: Implementada interfaz avanzada de administración de inquilinos en `/admin/saas/tenants`.
- **WAHA Service v3**: Refactorización completa del servicio de WhatsApp para soportar múltiples instancias aisladas por tenant.
- **Login OTP/Dual Mode**: Refactorización del formulario de login para soportar entrada dual (Contraseña o OTP) con validación asíncrona.

### 🔄 Changed
- **Versioning Sincronizado**: Actualizadas 123 commits acumulados desde la versión 2.7.1.
- **Layout Performance**: Optimización de carga de fuentes Inter y manejo de headers de tenant en el RootLayout.

## [2.7.1] - 2026-02-21

### 🚀 Fixed - Deployment & Support
- **Docker Optimization**: Corregido build en modo `standalone` de Next.js.
  - Optimizado `Dockerfile` con multi-stage build y `node:20-bookworm-slim`.
  - Implementado `node_modules_full` para scripts de seeding sin engrosar la imagen de runtime.
  - Corregido path de `server.js` en el runner stage.
- **Prisma compatibility**: Agregado `debian-openssl-3.0.x` a `binaryTargets` en el schema para soporte nativo en Docker.
- **WhatsApp Support**: Actualizado número de soporte a `4424000742` en configuraciones por defecto y Landing Page.
- **Versioning**: Sincronizada versión `2.7.1` en `package.json`, `VERSION`, `version.json` y Landing Page components.
- **Build Visibility**: Agregado log de progreso y verificaciones de módulos en el proceso de build local.

### 📝 Documentation & UX
- **Consolidation**: Eliminada documentación redundante y consolidada en un solo `ROADMAP.md`. 
  - Archivos eliminados: `ROADMAP_SISTEMA.md`, `ROADMAP_PENDIENTES.md`, `SUPER_ADMIN_STATUS.md`, `MULTI_TENANCY_PLAN.md`.
- **Login UX**: Eliminadas credenciales predeterminadas del login; añadido Tooltip informativo con credenciales para ambiente demo.
- **Cleaning**: Removidas todas las referencias obsoletas a Chatwoot en la documentación.

## [1.1.2] - 2025-10-31

### 🔧 Fixed - CRÍTICO
- **API Clients Route Faltante**: Creada ruta `/api/clients/route.ts` para creación de clientes
  - Implementado GET con paginación, filtros y control de acceso por rol
  - Implementado POST con validación completa y manejo de errores
  - Control de acceso: ADMIN (todos), ASESOR (solo sus clientes)
  - Validación de unicidad de email y teléfono
  
- **Enum EmploymentType Corregido**: Alineado valores con schema Prisma
  - `EMPLOYEE` → `EMPLOYED`
  - Eliminado `FREELANCER` (no existe en schema)
  - Actualizado en formularios new y edit

### 🎯 Funcionalidad
- Creación de clientes desde `/admin/clients/new` ahora funciona correctamente
- Formularios usan valores correctos del enum
- API maneja conversión de tipos de datos correctamente
- Errores específicos para constraints únicos (P2002)

### 📝 Documentación
- Creado `FIX_API_CLIENTS_CREATION_31_OCT_2025.md` con detalles completos del fix

## [1.1.1] - 2025-10-30

### 🔧 Fixed - CRÍTICO
- **Fix Yarn Lock Symlink**: Convertido `yarn.lock` de symlink a archivo real (496KB)
- **Eliminación Package Lock**: Removido `package-lock.json` para evitar conflictos (proyecto usa Yarn)
- **Core Dump Eliminado**: Removido archivo `app/core` de 2.2GB que bloqueaba push a GitHub
  - Eliminado del filesystem
  - Eliminado del historial de Git con `git filter-repo`
  - Agregado a `.gitignore`

### ✅ Validaciones
- Scripts de fix ejecutados exitosamente:
  - `scripts/fix-yarn-lock-symlink.sh`
  - `scripts/revision-fix.sh`
  - `scripts/validate-absolute-paths.sh`
  - `scripts/pre-push-check.sh`

### 📤 Deploy
- Force push exitoso a ambos repositorios:
  - github.com/qhosting/escalafin
  - github.com/qhosting/escalafinmx
- Historial de Git limpiado y optimizado

### 📝 Documentación
- Creado `FIX_DEPLOY_SYNC_29_OCT_2025.md`
- Actualizado `CHANGELOG.md`
- Actualizado `.gitignore` (core dumps)

---

## [1.1.0] - 2025-10-29

### ✨ Added
- Sistema de versionado automático implementado
- Endpoint `/api/system/version` para consultar versión
- Componente `VersionInfo` en layout principal
- Scripts de actualización de versión

### 🔄 Changed
- Estructura de archivos de versión:
  - `VERSION` (formato texto)
  - `version.json` (formato JSON)
  - `app/version.json` (para Next.js)

### 📚 Docs
- `SISTEMA_VERSIONADO.md` con documentación completa
- Guías de uso del sistema de versionado

---

## [1.0.0] - 2025-10-28

### 🎉 Initial Release
- Sistema completo de gestión de créditos y préstamos
- Autenticación con NextAuth.js
- Integración con Openpay
- PWA implementada
- Dashboard para Admin, Asesor y Cliente
- Sistema de notificaciones
- Integración con WhatsApp (EvolutionAPI)
- Sistema de scoring crediticio
- Gestión de archivos con AWS S3
- Base de datos PostgreSQL con Prisma

### 🔐 Security
- Implementación de roles y permisos
- Protección de rutas sensibles
- Encriptación de contraseñas con bcrypt
- Variables de entorno para secretos

### 🐳 Docker
- Dockerfile optimizado para producción
- Docker Compose para desarrollo local
- Configuración para EasyPanel

### 📖 Documentación
- README completo
- Guías de deployment
- Manual de usuario
- Documentación técnica

---

## Tipos de Cambios
- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Corrección de bugs
- `Security` - Cambios de seguridad

---
