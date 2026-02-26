# 🗺️ Roadmap Unificado - EscalaFin

Este documento es la única fuente de verdad para el estado del sistema, arquitectura, hitos alcanzados y planes futuros.

**Última Actualización**: Febrero 22, 2026  
**Versión Actual**: `2.7.1`

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

### Core Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI.
- **Backend**: Next.js API Routes, Node.js 20.x.
- **ORM**: Prisma 6.7.0.
- **Base de Datos**: PostgreSQL 15.
- **Caché/Colas**: Redis 7.x (Sesiones, Rate Limiting, BullMQ).
- **Infraestructura**: Docker (Debian 12 Bookworm Slim), NPM 10.8.2.
- **Almacenamiento**: AWS S3 / Almacenamiento Local Dual.

### Estrategia Multi-tenancy
El sistema utiliza una arquitectura de **aislamiento por identificador (`tenantId`)**:
1.  **Resolución de Subdominio**: `cliente.escalafin.com` se resuelve vía Middleware.
2.  **Capa de Datos**: `getTenantPrisma(tenantId)` inyecta automáticamente filtros en cada consulta.
3.  **Seguridad**: Bloqueo Cross-Tenant en Middleware para evitar accesos no autorizados.

---

## 📦 2. Módulos del Sistema (Estado Actual)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Auth & RBAC** | ✅ 100% | Roles: Super Admin, Admin, Asesor, Cliente. 2FA implementado. |
| **Gestión Clientes** | ✅ 100% | Scoring, documentación INE, referencias y avales. |
| **Motor Préstamos** | ✅ 100% | Interés Simple, Tarifa Fija e Interés Semanal. |
| **Cobranza & Pagos** | ✅ 100% | Mercado Pago, Openpay y registro de cobranza en campo con GPS. |
| **Comunicaciones** | ✅ 100% | WhatsApp (WAHA), SMS (LabsMobile), Notificaciones Push. |
| **Reportes & IA** | ✅ 100% | Exportación Excel, Motor de Scoring predictivo (IA Sigmoide). |
| **Cloud/Local Storage** | ✅ 100% | Sistema dual AWS S3 + Local Storage. |
| **Automatización** | ✅ 100% | Cron jobs para Backups (GDrive), Reportes Semanales y Limpieza. |

---

## 🚀 3. Historial de Implementación (Phases)

### ✅ FASE 1-3: Cimientos y Automatización (Completado Q1 2026)
- [x] Migración total de MongoDB a Redis/Postgres.
- [x] Implementación de Backups automáticos a Google Drive.
- [x] Integración de Pasarelas (Mercado Pago / Openpay).
- [x] Sistema de Configuración Dinámica por Tenant.

### ✅ FASE 4-5: Inteligencia y Cobranza Avanzada (Completado Feb 2026)
- [x] **IA Scoring**: Modelo predictivo de impago (entrenamiento mensual).
- [x] **Comunicaciones**: WhatsApp bidireccional y Chatbot (WAHA).
- [x] **Cobranza**: Optimización de rutas (Nearest Neighbor) y Promesas de Pago.
- [x] **SaaS Upgrade**: Dashboard global de Super Admin para control de Tenants.

---

## 🛡️ 4. Centro de Comando SaaS (Super Admin)

El Super Admin gestiona el ecosistema global de EscalaFin.

### Funcionalidades Operativas:
- ✅ **Gestión de Tenants**: Crear, suspender y editar organizaciones.
- ✅ **Facturación SaaS**: Control de planes, MRR y suscripciones activas.
- ✅ **Monitoreo**: Estado del sistema y uso de recursos por tenant.
- ✅ **Impersonación**: Capacidad de entrar como administrador de un tenant para soporte.

### 🚧 Pendiente en SaaS:
1.  **Validación de Firma API**: Firma criptográfica para webhooks de Openpay.
2.  **Analytics Profundo**: Cálculo real de Churn Rate, LTV y CAC.
3.  **Developer Portal**: Gestión de API Keys para integración externa de tenants.

---

## 🚧 5. Pendientes y Futuro (Roadmap Q3-Q4 2026)

### 📈 Prioridad Alta
- [ ] **API Pública v1**: Documentación Swagger/OpenAPI para integraciones de terceros.
- [ ] **Programa de Lealtad**: Motor de gamificación y puntos por pagos puntuales.
- [ ] **Email Marketing**: Automatización de campañas basadas en comportamiento del cliente.

### 📱 Prioridad Media
- [ ] **App Móvil Nativa (Android)**: 🚧 Inicio de desarrollo (Módulo de cobranza offline implementado en PWA/Capacitor core).
- [ ] **Marketplace de Garantías**: Gestión de colaterales y subastas internas.

### 🌐 Prioridad Baja
- [ ] **Multi-tenancy Físico**: Opción de aislar DBs por tenant para clientes enterprise.
- [ ] **App Móvil Nativa (iOS)**.

---

## 🔧 6. Notas de Despliegue (Build v2.7.1)

- **Login Experience**: Se eliminaron credenciales default. Se añadió **Tooltip** informativo para ambiente demo.
- **Infraestructura**: Despliegue optimizado en modo `standalone`. Soporte nativo para Prisma en containers Linux corregido.
- **Soporte**: Canal de WhatsApp actualizado: `4424000742`.
