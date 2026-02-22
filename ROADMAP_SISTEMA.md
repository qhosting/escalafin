# 🗺️ Roadmap del Sistema EscalaFin

Este documento proporciona una visión detallada de la arquitectura, módulos implementados y funcionalidades del sistema EscalaFin MVP.

**Última Actualización**: Febrero 22, 2026  
**Versión del Sistema**: 2.7.1

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Node.js 20.x
- **ORM**: Prisma 6.7.0
- **Base de Datos**: PostgreSQL 15
- **Caché**: Redis 7.x
- **Infraestructura**: Docker (Debian 12 Bookworm Slim), NPM 10.8.2
- **Almacenamiento**: AWS S3 / Almacenamiento Local Dual

### Estructura de Directorios Principal
```
/app
├── /app           # Rutas de la aplicación (Frontend)
│   ├── /admin     # Dashboard administrativo
│   ├── /asesor    # Dashboard de asesores
│   ├── /cliente   # Dashboard de clientes
│   ├── /mobile    # Versión móvil optimizada
│   └── /pwa       # PWA y módulos dinámicos
├── /api           # Endpoints de la API (Backend)
├── /prisma        # Esquema de base de datos y migraciones
├── /components    # Componentes reutilizables de UI
├── /lib           # Servicios y utilidades
└── /scripts       # Scripts de mantenimiento
```

---

## 📦 Módulos Principales Implementados

### 1. 🔐 **Autenticación y Seguridad** ✅
**Rutas**: `/auth/*`, `/api/auth/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- Sistema de login/logout con NextAuth.js
- Gestión de sesiones con refresh tokens
- Recuperación de contraseñas
- Verificación de email
- Sistema de roles con 3 niveles:
  - `ADMIN`: Acceso total al sistema
  - `ASESOR`: Gestión de clientes asignados y solicitudes
  - `CLIENTE`: Acceso a dashboard personal

**Archivos Clave**:
- `lib/auth.ts`: Configuración de NextAuth
- `app/auth/*`: Páginas de autenticación
- `components/auth/*`: Componentes de login/registro

---

### 2. 👥 **Gestión de Clientes** ✅
**Rutas**: `/admin/clients/*`, `/asesor/clients/*`, `/api/clients/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ CRUD completo de clientes
- ✅ Perfiles detallados con historial crediticio
- ✅ Referencias personales múltiples
- ✅ Sistema de avales (`Guarantor`)
- ✅ Garantías colaterales (`Collateral`)
- ✅ Score crediticio automático
- ✅ Subida de documentos (INE, comprobantes)
- ✅ Imágenes de perfil de cliente
- ✅ Configuración de notificaciones WhatsApp personalizadas
- ✅ Búsqueda y filtrado avanzado
- ✅ Asignación de clientes a asesores

**Modelos de Base de Datos**:
- `Client`: Información principal del cliente
- `PersonalReference`: Referencias personales
- `Guarantor`: Aval del cliente
- `Collateral`: Garantías colaterales
- `CreditScore`: Puntuación crediticia
- `CollectionVisit`: Registro de visitas de cobranza

**API Endpoints**:
- `GET /api/clients`: Listado con paginación y filtros
- `POST /api/clients`: Creación de cliente
- `GET /api/clients/[id]`: Detalle de cliente
- `PUT /api/clients/[id]`: Actualización de datos
- `GET /api/clients/search`: Búsqueda de clientes
- `GET /api/clients/me`: Perfil del cliente actual
- `POST /api/clients/[id]/profile-image`: Subida de imagen de perfil

---

### 3. 💰 **Gestión de Préstamos** ✅
**Rutas**: `/admin/loans/*`, `/asesor/loans/*`, `/api/loans/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Solicitudes de crédito (`CreditApplication`)
- ✅ Revisión y aprobación de solicitudes
- ✅ Creación de préstamos (`Loan`)
- ✅ **3 Métodos de Cálculo**:
  - **Interés Simple**: Cálculo tradicional con tasa anual
  - **Tarifa Fija**: Sistema escalonado por montos ($1K-$100K)
  - **Interés Semanal**: Interés semanal fijo sobre capital
- ✅ Tabla de amortización automática (`AmortizationSchedule`)
- ✅ Frecuencias de pago: Semanal, Catorcenal, Quincenal, Mensual
- ✅ Estados del préstamo: Activo, Pagado, En Mora, Cancelado
- ✅ Cálculo de saldos pendientes en tiempo real
- ✅ Edición de préstamos activos
- ✅ Búsqueda y filtrado avanzado

**Modelos de Base de Datos**:
- `CreditApplication`: Solicitudes de crédito
- `Loan`: Préstamos activos/históricos
- `AmortizationSchedule`: Tabla de amortización
- `WeeklyInterestRate`: Configuración de tarifas semanales

**API Endpoints**:
- `GET /api/credit-applications`: Listado de solicitudes
- `POST /api/credit-applications`: Nueva solicitud
- `POST /api/credit-applications/[id]/review`: Revisión de solicitud
- `GET /api/loans`: Listado de préstamos
- `POST /api/loans`: Creación de préstamo
- `GET /api/loans/[id]`: Detalle del préstamo
- `GET /api/loans/search`: Búsqueda de préstamos

**Utilidades**:
- `lib/loan-calculations.ts`: Motor de cálculo de préstamos
- `lib/config-service.ts`: Configuración dinámica de tarifas

---

### 4. 💸 **Cobranza y Pagos** ✅
**Rutas**: `/admin/payments/*`, `/api/payments/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Registro de pagos manuales
- ✅ Pagos automáticos con Mercado Pago
- ✅ Integración con Openpay (tarjetas)
- ✅ Cobranza en campo (`CashCollection`)
- ✅ Registro de ubicación GPS de cobrador
- ✅ Evidencia fotográfica de pago
- ✅ Conciliación automática de saldos
- ✅ Historial completo de transacciones
- ✅ Estados: Pendiente, Completado, Fallido, Cancelado

**Modelos de Base de Datos**:
- `Payment`: Registro de pagos
- `PaymentTransaction`: Transacciones con pasarelas
- `CashCollection`: Cobranza en campo

**API Endpoints**:
- `GET /api/payments`: Listado de pagos
- `POST /api/payments`: Registro de pago manual
- `POST /api/payments/cash`: Pago en efectivo
- `POST /api/payments/mercadopago/create-preference`: Crear link de pago
- `GET /api/payments/transactions`: Historial de transacciones
- `POST /api/webhooks/mercadopago`: Webhook de Mercado Pago
- `POST /api/webhooks/openpay`: Webhook de Openpay

**Integraciones**:
- Mercado Pago (Checkout Pro + Webhooks)
- Openpay (Procesamiento de tarjetas)

---

### 5. 📱 **Comunicación y Notificaciones** ✅
**Rutas**: `/admin/whatsapp/*`, `/api/notifications/*`, `/api/whatsapp/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Notificaciones in-app
- ✅ Envío de WhatsApp mediante **WAHA API**
- ✅ Envío de SMS mediante **LabsMobile**
- ✅ Plantillas de mensajes configurables (`MessageTemplate`)
- ✅ Variables dinámicas en plantillas
- ✅ Mensajes automáticos:
  - Pago recibido
  - Recordatorio de pago
  - Préstamo aprobado
  - Actualizaciones de préstamo
  - Marketing
- ✅ Configuración de preferencias por cliente
- ✅ Historial de mensajes enviados
- ✅ Estados de entrega: Enviado, Entregado, Leído
- ✅ Sistema de webhooks para ACK de WAHA
- ✅ Sistema de webhooks para ACK de WAHA

**Modelos de Base de Datos**:
- `Notification`: Notificaciones internas
- `WhatsAppMessage`: Mensajes de WhatsApp
- `MessageTemplate`: Plantillas de mensajes
- `WahaConfig`: Configuración de WAHA

**API Endpoints**:
- `GET /api/notifications`: Notificaciones del usuario
- `POST /api/notifications/[id]/read`: Marcar como leída
- `POST /api/notifications/mark-all-read`: Marcar todas como leídas
- `GET /api/notifications/settings`: Configuración de notificaciones
- `GET /api/whatsapp/*`: Gestión de WhatsApp
- `POST /api/webhooks/waha`: Webhook de WAHA
- `GET /api/admin/waha/config`: Configuración WAHA
- `POST /api/admin/message-templates`: Plantillas de mensajes
- `POST /api/admin/settings/labsmobile/*`: Configuración LabsMobile

**Servicios**:
- `lib/waha.ts`: Cliente de WAHA API
- `lib/whatsapp-notification.ts`: Servicio de notificaciones WhatsApp
- `lib/labsmobile.ts`: Cliente de LabsMobile SMS
- `lib/create-notification.ts`: Creación de notificaciones

---

### 6. 📊 **Reportes y Analytics** ✅
**Rutas**: `/admin/reports/*`, `/admin/analytics/*`, `/api/reports/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Dashboard ejecutivo con KPIs
- ✅ Reporte de cartera vencida
- ✅ Análisis de cobranza
- ✅ Reportes semanales automáticos por email
- ✅ Analytics de clientes y demografía
- ✅ Exportación de datos a Excel
- ✅ Visualización de tendencias
- ✅ Generación programada de reportes
- ✅ Auditoría completa del sistema (`AuditLog`)

**Modelos de Base de Datos**:
- `ReportGeneration`: Reportes generados
- `AuditLog`: Registro de auditoría

**API Endpoints**:
- `GET /api/reports/collections`: Reporte de cobranza
- `GET /api/reports/due-loans`: Préstamos por vencer
- `GET /api/cron/weekly-report`: Reporte semanal automático

**Componentes**:
- `components/analytics/*`: Visualizaciones y gráficos
- `components/dashboards/*`: Dashboards por rol
- `lib/analytics.ts`: Motor de análisis

---

### 7. 📂 **Gestión de Archivos** ✅
**Rutas**: `/admin/files/*`, `/api/files/*`, `/api/images/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Carga de documentos (INE, comprobantes, contratos)
- ✅ Almacenamiento **dual**: AWS S3 + Local
- ✅ Configuración dinámica de storage
- ✅ Validación de tipos MIME y tamaño
- ✅ Categorización de archivos
- ✅ Estados: Subido, Verificado, Rechazado, Expirado
- ✅ Verificación por administradores
- ✅ Visualización de imágenes
- ✅ Descarga segura de archivos

**Modelos de Base de Datos**:
- `FileUpload`: Sistema de archivos principal
- `File`: Sistema dual de archivos

**API Endpoints**:
- `GET /api/files/[...path]`: Descarga de archivos
- `GET /api/images/[...path]`: Servir imágenes
- `POST /api/admin/storage/*`: Configuración de almacenamiento

**Servicios**:
- `lib/storage-service.ts`: Servicio unificado de storage
- `lib/unified-storage.ts`: Abstracción de almacenamiento
- `lib/local-storage.ts`: Almacenamiento local
- `lib/s3.ts`: Cliente de AWS S3
- `lib/storage-config.ts`: Configuración dinámica

---

### 8. ⚙️ **Configuración del Sistema** ✅
**Rutas**: `/admin/config/*`, `/admin/settings/*`, `/api/admin/config/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Configuración dinámica de tarifas y tasas
- ✅ Configuración de tasas de interés semanales
- ✅ Configuración de cálculos de préstamos
- ✅ Gestión de usuarios y roles
- ✅ Configuración de módulos PWA
- ✅ Configuración de integraciones:
  - WAHA (WhatsApp)
  - LabsMobile (SMS)
  - Mercado Pago
  - Openpay
  - AWS S3
- ✅ Sistema de permisos por rol y módulo

**Modelos de Base de Datos**:
- `SystemConfig`: Configuración del sistema
- `PWAModule`: Módulos dinámicos
- `ModuleRolePermission`: Permisos por rol
- `ModuleChangeLog`: Histórico de cambios

**API Endpoints**:
- `GET /api/admin/config/loans`: Configuración de préstamos
- `GET /api/admin/users`: Gestión de usuarios
- `POST /api/admin/modules`: Módulos del sistema
- `GET /api/admin/weekly-interest-rates`: Tarifas semanales
- `POST /api/admin/weekly-interest-rates`: Crear/actualizar tarifa

---

### 9. 🎯 **Scoring Crediticio e IA** ✅
**Rutas**: `/admin/scoring/*`, `/api/scoring/*`  
**Estado**: ✅ Early Access

**Funcionalidades**:
- ✅ Motor de scoring basado en reglas
- ✅ **Modelo Predictivo de IA** (Sigmoide)
- ✅ Análisis de factores de riesgo:
  - Historial de pagos
  - Ingresos vs. deuda
  - Antigüedad laboral
  - Referencias personales
  - Historial crediticio
- ✅ Niveles de riesgo: Bajo, Medio, Alto, Muy Alto
- ✅ Recomendaciones: Aprobar, Revisar, Rechazar
- ✅ Probabilidad de impago (IA)
- ✅ Factores clave identificados
- ✅ Visualización premium de insights

**Modelos de Base de Datos**:
- `CreditScore`: Puntuaciones crediticias

**Servicios**:
- `lib/scoring.ts`: Motor de scoring tradicional
- `lib/predictive-model.ts`: Modelo de IA

**Pendiente**:
- ⏳ Entrenamiento continuo del modelo con datos reales
- ⏳ Actualización de pesos del modelo

---

### 10. 📱 **PWA y Módulos Dinámicos** ✅
**Rutas**: `/pwa/*`, `/mobile/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Progressive Web App instalable
- ✅ Modo offline
- ✅ Notificaciones push
- ✅ Módulos dinámicos habilitables por rol
- ✅ Versión móvil optimizada
- ✅ Búsqueda rápida de clientes
- ✅ Acciones directas: Llamar, WhatsApp, Ubicación
- ✅ Geolocalización para cobranza en campo

**Servicios**:
- `lib/pwa-utils.ts`: Utilidades de PWA
- `components/pwa/*`: Componentes de PWA

---

### 11. 🔄 **Automatización (Cron Jobs)** ✅
**Rutas**: `/api/cron/*`  
**Estado**: ✅ Completo

**Funcionalidades**:
- ✅ Backup automático (PostgreSQL + Redis)
- ✅ Subida a Google Drive
- ✅ Reporte semanal por email
- ✅ Limpieza de archivos temporales
- ✅ Recordatorios de pago automáticos

**API Endpoints**:
- `GET /api/cron/backup`: Backup de base de datos
- `GET /api/cron/weekly-report`: Reporte semanal
- `GET /api/cron/reminders`: Recordatorios de pago
- `GET /api/cron/cleanup`: Limpieza de sistema

**Servicios**:
- `lib/backup-service.ts`: Servicio de backups
- `lib/google-drive.ts`: Cliente de Google Drive
- `lib/scheduled-tasks.ts`: Tareas programadas

---

## 🔄 Integraciones Externas

| Servicio | Propósito | Estado | Notas |
|----------|-----------|--------|-------|
| **WAHA** | API externa de WhatsApp | ✅ Implementado | Sin instalación local, conexión a instancia externa |
| **LabsMobile** | Envío de SMS masivos | ✅ Implementado | Créditos de SMS configurables |
| **Mercado Pago** | Checkout Pro + Webhooks | ✅ Implementado | Abonos automáticos de clientes |
| **Openpay** | Procesamiento de tarjetas | ✅ Implementado | Pagos con tarjeta de débito/crédito |
| **AWS S3** | Almacenamiento en la nube | ✅ Implementado | Sistema dual con almacenamiento local |
| **Google Drive** | Backup automático | ✅ Implementado | Subida diaria de backups |
| **Google Maps** | Visualización de direcciones | ✅ Implementado | Enlaces externos |

---

## 🚀 Flujos Críticos del Sistema

### 1. Originación de Crédito
```
Cliente solicita → Asesor registra aplicación → Sistema calcula score → 
Admin revisa → Aprueba/Rechaza → Genera préstamo → Crea tabla de amortización → 
Notifica a cliente (WhatsApp/SMS)
```

### 2. Ciclo de Cobranza
```
Sistema genera cuotas → Notifica vencimientos → Cliente paga → 
Sistema registra pago → Actualiza saldo → Notifica confirmación → 
Si hay mora: Recordatorios automáticos
```

### 3. Cobranza en Campo
```
Asesor visita cliente → Registra ubicación GPS → Toma foto evidencia → 
Registra pago en efectivo → Sistema actualiza saldo → 
Genera recibo → Envía confirmación a cliente
```

### 4. Onboarding de Clientes
```
Registro inicial → Subida de documentos (INE, comprobante) → 
Referencias personales → Validación de identidad → 
Cálculo de score crediticio → Asignación a asesor → 
Activación del cliente
```

---

## 📊 Estadísticas del Sistema

### Modelos de Base de Datos
- **Total**: 29 modelos principales
- **Usuarios y Autenticación**: 4 modelos
- **Clientes**: 5 modelos
- **Préstamos**: 6 modelos
- **Pagos**: 3 modelos
- **Comunicaciones**: 5 modelos
- **Sistema**: 6 modelos

### API Endpoints
- **Total**: ~85+ endpoints
- **Admin**: ~35 endpoints
- **Públicos**: ~25 endpoints
- **Webhooks**: 3 endpoints
- **Cron Jobs**: 4 endpoints
- **Clientes/Asesores**: ~20 endpoints

### Componentes UI
- **Total**: ~150+ componentes
- **Dashboards**: 6 dashboards especializados
- **Formularios**: 15+ formularios
- **Listas y Tablas**: 20+ componentes
- **UI Base**: 54 componentes Radix UI

---

## 🛠️ Despliegue y DevOps

### Contenerización
- **Dockerfile**: Optimizado para Debian 12 Bookworm
- **Multi-stage build**: Base → Deps → Builder → Runner
- **Node 18**: bookworm-slim
- **Yarn 4.10.3**: Gestor de paquetes
- **Prisma**: Generación en tiempo de build
- **Healthcheck**: Endpoint `/api/health`

### Dependencias del Sistema
- PostgreSQL Client
- Redis Tools (**nuevo**: reemplaza MongoDB)
- OpenSSL, Curl, Wget
- Bash, Dumb-init

### Scripts de Mantenimiento
```
/scripts
├── setup-users-production.js    # Crear usuarios iniciales
├── backup-db.sh                  # Backup manual de DB
├── restore-db.sh                 # Restaurar DB
├── cleanup_project.sh            # Limpieza de archivos
└── auto_cleanup.sh               # Limpieza automática
```

### Scripts de Inicio
```
start-improved.sh       # Inicio con logging detallado + manejo de errores
emergency-start.sh      # Bypass de checks de DB para debug
healthcheck.sh          # Script de healthcheck
```

### Variables de Entorno Requeridas
```env
DATABASE_URL              # PostgreSQL connection string
REDIS_URL                 # Redis connection string
NEXTAUTH_URL              # URL de la aplicación
NEXTAUTH_SECRET           # Secret para NextAuth
NODE_ENV                  # production / development
GOOGLE_SERVICE_ACCOUNT_JSON  # Para backups a Drive
GOOGLE_DRIVE_FOLDER_ID    # ID de carpeta de backups
WAHA_BASE_URL             # URL de WAHA API
WAHA_API_KEY              # API key de WAHA (opcional)
AWS_S3_BUCKET_NAME        # Bucket de S3 (opcional)
AWS_ACCESS_KEY_ID         # AWS credentials (opcional)
AWS_SECRET_ACCESS_KEY     # AWS credentials (opcional)
```

---

## 📝 Notas Técnicas

### Cambios Recientes (Febrero 2026)
- ✅ **Version v2.7.1**: Sincronización completa de versiones y metadatos del sistema.
- ✅ **Docker Optimization**: Build en modo `standalone` corregido y optimizado con multi-stage build.
- ✅ **Prisma Native Support**: Configurado `debian-openssl-3.0.x` para ejecución directa en Docker Linux.
- ✅ **Login UX**: Eliminadas credenciales predeterminadas; añadido Tooltip de ayuda con credenciales de demo.
- ✅ **Support Update**: WhatsApp de soporte actualizado a `4424000742` en Landing Page y configuraciones.
- ✅ Reemplazo de MongoDB por Redis para cache/backups.
- ✅ Soporte completo de backup de Redis (RDB).
- ✅ Agregadas acciones de auditoría para WAHA.
- ✅ Limpieza de documentación histórica.
- ✅ Actualización de Dockerfile con redis-tools.

### Próximas Mejoras
- Sistema de mensajería interna entre usuarios
- Dashboard de métricas en tiempo real
- Exportación masiva de datos
- API pública para integraciones externas

---

**Documentación Complementaria**:
- Ver `ROADMAP_PENDIENTES.md` para tareas futuras
- Ver `GUIA_BACKUP_GDRIVE.md` para configuración de backups
- Ver `SISTEMA_VERSIONADO.md` para sistema de versiones
- Ver `SECURITY.md` para políticas de seguridad
