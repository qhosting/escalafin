# 🗺️ Roadmap del Sistema EscalaFin

Este documento proporciona una visión detallada de la arquitectura, módulos y funcionalidades del sistema EscalaFin.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Base de Datos**: PostgreSQL 15.
- **Infraestructura**: Docker, Easypanel (Debian 12 Bookworm).
- **Almacenamiento**: AWS S3 / Almacenamiento Local.

### Estructura de Directorios Principal
- `/app/app`: Rutas de la aplicación (Frontend).
- `/app/api`: Endpoints de la API (Backend).
- `/app/prisma`: Esquema de base de datos y migraciones.
- `/app/components`: Componentes reutilizables de UI.

---

## 📦 Módulos Principales

### 1. 🔐 Autenticación y Seguridad (`/auth`, `/api/auth`)
- **Funciones**: Login, Logout, Gestión de Sesiones.
- **Tecnología**: NextAuth.js.
- **Roles**:
  - `ADMIN`: Acceso total al sistema.
  - `ASESOR`: Gestión de clientes y solicitudes.
  - `CLIENTE`: Acceso a dashboard personal.

### 2. 👥 Gestión de Clientes (`/admin/clients`, `/api/clients`)
- **Funciones**:
  - CRUD completo de clientes.
  - Perfiles detallados con historial.
  - Referencias personales y avales.
  - Score crediticio.
  - Subida de documentos e imágenes de perfil.

### 3. 💰 Gestión de Préstamos (`/admin/loans`, `/api/loans`)
- **Funciones**:
  - Solicitudes de crédito (`CreditApplication`).
  - Creación y aprobación de préstamos (`Loan`).
  - Cálculo de tablas de amortización (`AmortizationSchedule`).
  - Tipos de cálculo: Interés simple, Tarifa fija, Interés semanal.
  - Estado del préstamo: Activo, Pagado, En Mora.

### 4. 💸 Cobranza y Pagos (`/admin/payments`, `/api/payments`)
- **Funciones**:
  - Registro de pagos manuales y automáticos.
  - Integración con pasarelas de pago.
  - Conciliación de saldos.
  - Gestión de cobranza en campo (`CashCollection`).

### 5. 📱 Comunicación y Notificaciones (`/admin/notifications`, `/api/notifications`)
- **Funciones**:
  - Envío de notificaciones por WhatsApp y Email.
  - Plantillas de mensajes configurables.
  - Integración con **EvolutionAPI** para WhatsApp.
  - Alertas automáticas de vencimiento de pago.

### 6. 📊 Reportes y Analytics (`/admin/reports`, `/api/reports`)
- **Funciones**:
  - Dashboard ejecutivo con KPIs.
  - Reportes de cartera vencida.
  - Análisis de pagos y demografía de clientes.
  - Exportación de datos.

### 7. 📂 Gestión de Archivos (`/api/files`, `/api/upload`)
- **Funciones**:
  - Carga y almacenamiento de documentos (INE, Comprobantes).
  - Almacenamiento dual: AWS S3 y Local.
  - Validación de tipos de archivo y tamaño.

### 8. 📱 Módulo Móvil (`/mobile`)
- **Funciones**:
  - Versión optimizada para dispositivos móviles.
  - Búsqueda rápida de clientes.
  - Acciones directas: Llamar, Email, Ubicación.

---

## 🔄 Integraciones Externas

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| **Openpay** | Procesamiento de pagos en línea | ✅ Implementado |
| **EvolutionAPI** | Envío de mensajes de WhatsApp | ✅ Implementado |
| **AWS S3** | Almacenamiento de archivos en la nube | ✅ Implementado |
| **Google Maps** | Visualización de direcciones de clientes | ✅ Enlaces externos |

---

## 🚀 Flujos Críticos

1.  **Originación de Crédito**: Solicitud -> Evaluación (Score) -> Aprobación -> Desembolso.
2.  **Ciclo de Cobranza**: Generación de cuotas -> Notificación de pago -> Recepción de pago -> Conciliación.
3.  **Onboarding de Clientes**: Registro -> Validación de identidad (Documentos) -> Activación.

---

## 🛠️ Despliegue (DevOps)

- **Contenerización**: Dockerfile optimizado para Debian 12 (Bookworm).
- **Orquestación**: Easypanel.
- **CI/CD**: Git push to deploy (vía Easypanel o similar).
- **Scripts**: Scripts de mantenimiento y backup en `/scripts`.
