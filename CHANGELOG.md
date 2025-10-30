
# Changelog

Todos los cambios notables del proyecto EscalaFin MVP serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] - 2025-10-30

### 🔧 Corregido (Fixed)

#### Portabilidad y Compatibilidad con Deploy
- **Rutas absolutas eliminadas** - Reemplazadas todas las rutas hardcodeadas `/home/ubuntu/escalafin_mvp/` con rutas relativas portátiles
  - `app/api/admin/storage/test/route.ts` - Usa `process.cwd()` para directorio de uploads
  - `app/api/admin/storage/config/route.ts` - Usa variable de entorno `LOCAL_UPLOAD_DIR`
  - `app/api/files/[...path]/route.ts` - Implementa fallback con `process.cwd()`
  
- **Prisma Schema** - Removida ruta absoluta del `output` path
  - Cliente Prisma ahora se genera en ubicación por defecto
  - Compatible con Docker, desarrollo y producción
  - Regenerado con configuración correcta

- **Package Manager** - Eliminado `yarn.lock` 
  - El proyecto usa NPM exclusivamente
  - Evita conflictos y builds inconsistentes
  - Solo queda `package-lock.json`

#### Scripts de Validación
- Ejecutados y pasados todos los scripts pre-deploy:
  - `fix-yarn-lock-symlink.sh`
  - `validate-absolute-paths.sh`
  - `pre-push-check.sh`
  - `revision-fix.sh`

### ✨ Agregado (Added)

- **Sistema de Versionado**
  - Archivo `VERSION` con número de versión simple
  - Archivo `version.json` con metadata detallada
  - Este `CHANGELOG.md` para tracking de cambios
  - Build number con formato fecha: `YYYYMMDD.NNN`

- **Documentación de Fixes**
  - `RESUMEN_FIXES_PRE_DEPLOY_30_OCT_2025.md` - Guía completa de correcciones
  - `FIX_DEPLOY_SYNC_29_OCT_2025.md` - Fix de sincronización
  - Instrucciones detalladas de troubleshooting
  - Checklist de verificación pre-deploy

### 🔄 Modificado (Changed)

- **Configuración de Variables de Entorno**
  - Agregado soporte para `LOCAL_UPLOAD_DIR` (opcional)
  - Fallbacks inteligentes para todas las rutas de archivos
  - Configuración más flexible por entorno

- **Compatibilidad Docker**
  - Código 100% portable entre entornos
  - Sin dependencias de rutas específicas del host
  - Compatible con: Docker, EasyPanel, Coolify, Kubernetes

### 📊 Información Técnica

**Commit:** `20e7fc7`  
**Build:** `20251030.001`  
**Node.js:** 18.x  
**Next.js:** 14.2.28  
**Prisma:** 6.7.0  

**Repositorios sincronizados:**
- `qhosting/escalafin`
- `qhosting/escalafinmx`

---

## [1.0.0] - 2025-10-29

### 🎉 Lanzamiento Inicial

Versión inicial del sistema EscalaFin MVP - Sistema de Gestión de Préstamos y Créditos.

#### Características Principales

##### 🔐 Autenticación y Autorización
- Sistema completo con NextAuth.js
- Roles: Admin, Asesor, Cliente, Cobranza
- Sesiones seguras con JWT
- Protección de rutas y API endpoints

##### 👥 Gestión de Usuarios
- CRUD completo de usuarios
- Perfiles de usuario personalizables
- Sistema de permisos por rol
- Gestión de asesores y clientes

##### 💰 Gestión de Préstamos
- Solicitudes de crédito
- Aprobación/rechazo de préstamos
- Cálculo de cuotas y amortización
- Tracking de pagos
- Estados de préstamo (activo, pagado, vencido)

##### 💳 Pagos
- Integración con Openpay
- Pagos en efectivo
- Historial de transacciones
- Comprobantes de pago
- Sincronización de pagos

##### 📊 Reportes y Analytics
- Dashboard administrativo
- Dashboard de asesor
- Dashboard de cliente
- Reportes de cobranza
- Préstamos próximos a vencer
- Estadísticas de cartera

##### 📁 Gestión de Archivos
- Carga de documentos
- Almacenamiento local y S3
- Gestión de comprobantes
- Imágenes de perfil

##### 📱 Progressive Web App (PWA)
- Instalable en dispositivos móviles
- Funciona offline (modo limitado)
- Notificaciones push
- Diseño responsive

##### 🔔 Notificaciones
- Sistema de notificaciones en tiempo real
- Alertas de préstamos vencidos
- Notificaciones de pagos
- Configuración personalizable

##### 💬 Soporte y Comunicación
- Integración con Chatwoot (configurable)
- WhatsApp notifications via EvolutionAPI
- Sistema de tickets de soporte

##### 🎨 UI/UX
- Diseño moderno con Tailwind CSS
- Componentes de shadcn/ui
- Tema claro/oscuro
- Responsive design
- Accesibilidad mejorada

#### Stack Tecnológico

**Frontend:**
- Next.js 14.2.28 (App Router)
- React 18.2.0
- TypeScript 5.2.2
- Tailwind CSS 3.3.3
- shadcn/ui components

**Backend:**
- Next.js API Routes
- NextAuth.js 4.24.11
- Prisma ORM 6.7.0
- PostgreSQL

**Integraciones:**
- Openpay (pagos)
- AWS S3 (almacenamiento)
- Chatwoot (soporte)
- EvolutionAPI (WhatsApp)

**DevOps:**
- Docker multi-stage builds
- EasyPanel compatible
- Coolify compatible
- Scripts de deployment automatizados

#### Estructura del Proyecto

```
escalafin_mvp/
├── app/                    # Aplicación Next.js
│   ├── app/               # App router (rutas y páginas)
│   ├── components/        # Componentes React
│   ├── lib/              # Utilidades y servicios
│   ├── prisma/           # Schema y migraciones
│   ├── public/           # Archivos estáticos
│   └── scripts/          # Scripts de setup
├── scripts/              # Scripts de utilidad
├── Dockerfile           # Configuración Docker
└── docs/               # Documentación
```

#### Usuarios de Prueba

**Administrador:**
- Email: admin@escalafin.com
- Password: admin123

**Asesor:**
- Email: asesor@escalafin.com
- Password: asesor123

**Cliente:**
- Email: cliente@escalafin.com
- Password: cliente123

#### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Openpay (opcional)
OPENPAY_ID=...
OPENPAY_PRIVATE_KEY=...
OPENPAY_PUBLIC_KEY=...

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=...
AWS_REGION=...

# Chatwoot (opcional)
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN=...
CHATWOOT_API_ACCESS_TOKEN=...
```

---

## Formato de Versionado

El proyecto sigue [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (1.X.0): Nuevas funcionalidades compatibles
- **PATCH** (1.0.X): Correcciones de bugs compatibles

### Build Numbers

Formato: `YYYYMMDD.NNN`
- YYYYMMDD: Fecha del build
- NNN: Número secuencial del día (001, 002, etc.)

Ejemplo: `20251030.001` = Primer build del 30 de octubre de 2025

---

## Tipos de Cambios

- **🎉 Agregado (Added)**: Nuevas funcionalidades
- **🔄 Modificado (Changed)**: Cambios en funcionalidades existentes
- **⚠️ Deprecado (Deprecated)**: Funcionalidades que serán removidas
- **🗑️ Removido (Removed)**: Funcionalidades eliminadas
- **🔧 Corregido (Fixed)**: Corrección de bugs
- **🔒 Seguridad (Security)**: Correcciones de seguridad

---

## Links Útiles

- [Repositorio Principal](https://github.com/qhosting/escalafin)
- [Repositorio EscalafinMX](https://github.com/qhosting/escalafinmx)
- [Documentación de Deploy](./DEPLOYMENT_GUIDE.md)
- [Guía de Contribución](./CONTRIBUTING.md)
- [Seguridad](./SECURITY.md)

---

**Mantenido por:** Equipo EscalaFin  
**Última actualización:** 2025-10-30
