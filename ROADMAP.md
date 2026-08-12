# 🗺️ Roadmap Unificado y Catálogo de Páginas por Rol - EscalaFin

Este documento constituye la **única fuente de verdad** para la arquitectura, el catálogo exhaustivo de páginas y funciones clasificadas por rol de usuario, el estado del sistema y la planificación futura de **EscalaFin**.

**Última Actualización**: Agosto 2026  
**Versión Actual del Sistema**: `3.3.0`  
**Estado General**: Producción (SaaS Multi-tenant / Enterprise Ready)

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

### Core Stack
- **Frontend Framework**: Next.js 14.2.28 (App Router), React 18.2, TypeScript 5.2, Tailwind CSS 3.3, Radix UI primitives, Lucide Icons, Framer Motion.
- **Backend & API**: Next.js API Routes (Node.js 20.x runtime), Middleware de resolución multi-tenant y RBAC. API Pública v1 con autenticación por `X-API-Key`.
- **ORM & Base de Datos**: Prisma ORM `6.7.0`, PostgreSQL **17.10** con aislamiento dinámico por `tenantId` (`getTenantPrisma`). **8 índices compuestos de rendimiento** aplicados en producción (`loans`, `payments`, `amortization_schedule`).
- **Caché & Colas**: Redis 7.x con capa de caché Memory Fallback + stale-while-revalidate (`app/lib/performance.ts`).
- **Móvil & PWA**: Capacitor 8.2 (Android/iOS builds) + Progressive Web App con **Offline Sync Engine nativo IndexedDB**.
- **Integraciones de Comunicación**: WAHA API (WhatsApp Webhook Engine), **WhatsApp Flows Interactivos**, LabsMobile API (SMS Transaccionales), Web Push Notifications.
- **Seguridad & Firma Digital**: Constancia de conservación **NOM-151** con hash SHA-256, estampa de tiempo e IP/GPS.
- **Pasarelas de Pago**: Openpay (Tarjetas/SPEI/Conveniencia), Mercado Pago (Checkout Pro y Subscripciones SaaS).
- **Monitoreo & Archivos**: Sentry SDK (`^10.38.0`), AWS S3 SDK (`^3.893.0`) + Almacenamiento Local Dual.

---

## 👤 2. Clasificación Exhaustiva de Páginas y Funciones por Rol

El sistema cuenta con más de **85 páginas y vistas** organizadas jerárquicamente por el rol de acceso asignado (`UserRole`).

---

### 🛡️ Rol 1: SUPER_ADMIN (Command Center SaaS)
*Acceso exclusivo para los administradores globales de la plataforma EscalaFin.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/saas` | **Dashboard Maestro SaaS** | Muestra el MRR (Monthly Recurring Revenue), total de tenants activos/suspendidos, volumen de crédito procesado a nivel global y métricas de churn. |
| `/admin/saas/tenants` | **Gestión Global de Tenants** | Lista general de empresas registradas. Permite crear tenants, cambiar planes, suspender accesos y ejecutar el **Full Data Purge** (borrado seguro en cascada compliance). |
| `/admin/saas/tenants/[id]/users` | **Control de Usuarios por Tenant** | Administra los usuarios pertenecientes a una organización específica directamente desde la consola maestra. |
| `/admin/saas/security` | **Seguridad Global & Sentinel Metrics** | Monitor de seguridad de la plataforma, lista negra de IPs bloqueadas, intentos fallidos de login y auditoría de accesos sensibles. |
| `/admin/saas/settings` | **Configuración Maestra SaaS** | Ajustes globales del sistema, conexión centralizada del motor WAHA/WhatsApp para notificaciones de la plataforma y credenciales de cobro SaaS. |
| `/admin/super-users` | **Gestión de Administradores SaaS** | Alta, baja y asignación de privilegios para usuarios con rol `SUPER_ADMIN`. |

---

### 🏢 Rol 2: ADMIN (Administrador de Financiera / Tenant)
*Acceso completo a la operación, finanzas, personal, comisiones, reportes y clientes de la organización.*

#### 📊 Dashboard, Analítica & Auditoría
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/dashboard` | **Dashboard Ejecutivo** | Resumen operativo del tenant: Cartera activa, recuperación diaria/semanal, tasa de morosidad, solicitudes pendientes y saldo disponible. |
| `/admin/analytics` | **Analítica Financiera Avanzada** | Gráficas interactivas con Chart.js/Recharts sobre comportamiento de pago, proyección de flujo de caja y rentabilidad de cartera. |
| `/admin/audit` | **Logs de Auditoría** | Trazabilidad completa de acciones realizadas por el personal (creación de créditos, cobros, modificaciones de tasa, cancelaciones). |

#### 👥 Clientes, Bóveda Digital & Solicitudes
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/clients` | **Directorio de Clientes** | Lista de acreditados con búsqueda avanzada, filtro por estatus (Activo, Inactivo, Lista Negra, Bloqueado PLD) y scoring crediticio. |
| `/admin/clients/new` | **Alta de Cliente (Tabs UI)** | Formulario por **5 Pestañas Temáticas con colores activos**: <br>• **1. General**: Nombre, contacto, fecha nacimiento y fotografía biométrica.<br>• **2. Domicilio & GPS**: Dirección física y coordenadas GPS.<br>• **3. Financiera & Empleo**: Ingresos, score, cuenta bancaria y empleo.<br>• **4. Aval & Garantías**: Datos de aval, GPS de aval y bienes en prenda.<br>• **5. Bóveda Digital & PDF**: Subida de documentos KYC y generador de Expediente PDF. |
| `/admin/clients/migrate` | **Migración Masiva desde Excel** | Herramienta de importación masiva de cartera histórica desde archivos `.xlsx`/`.csv` con validación de duplicados. |
| `/admin/clients/[id]` | **Expediente 360° del Cliente** | Expediente digital unificado por **6 Pestañas Temáticas**: Historial crediticio, tabla de amortizaciones activas con números cortos (`#EF-001`), geolocalización GPS, moratorios, datos bancarios (CLABE), avales y prendas. |
| `/admin/clients/[id]/edit` | **Edición de Cliente (Tabs UI)** | Modificación en **4 Pestañas Temáticas**: <br>• **1. General & Estado**: Datos personales, estado activo/inactivo/suspendido y edición de foto.<br>• **2. Domicilio & GPS**: Dirección y ubicación GPS.<br>• **3. Financiera, Empleo & Moratorios**: Ingresos, banco, empleo y tarifas de multas diarias.<br>• **4. Aval & Garantías**: Datos de aval, GPS y lista de prendas. |
| `/admin/credit-applications` | **Solicitudes de Crédito** | Evaluación de nuevas solicitudes. Permite aprobar, rechazar, solicitar ajustes o enviar a revisión de comisionado. |

#### 💵 Préstamos y Motor de Crédito
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/loans` | **Gestión de Préstamos** | Control total de cartera con números cortos (`#EF-001`): Préstamos Activos, Liquidados, En Morosidad, Refinanciados y Cancelados. |
| `/admin/loans/new` | **Originación de Crédito** | Simulador y emisor de préstamos. Soporta Interés Simple, Tarifa Fija, Interés Semanal y modelo Por Mil ($120/mil). Generación de Pagaré Digital NOM-151. |
| `/admin/loans/[id]` | **Detalle de Préstamo (Tabs UI)** | Visión detallada del crédito en 4 pestañas con colores activos (Detalles, Pagos, Plan de Pagos, Cliente), amortizaciones pagadas/pendientes, cálculo automático de recargos, contrato NOM-151 y recibos PDF. |
| `/admin/loans/[id]/edit` | **Reestructuración de Crédito** | Ajuste extraordinario de plazos, condonación de recargos o modificación de condiciones aprobadas. |
| `/admin/weekly-interest-rates` | **Configuración de Tasas Semanales** | Matriz de ajuste dinámico de tasas de interés y descuentos por nivel de riesgo del cliente. |

#### 💳 Cobranza, Recargos, Comisiones & Reportes
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/payments` | **Registro y Recepción de Pagos** | Captura manual de abonos en efectivo, transferencias bancarias, cheques y conciliación de fichas de depósito. |
| `/admin/payments/new` | **Alta de Abono Individual / Lote** | Registro rápido de cobro aplicando prelación: 1° Recargos, 2° Interés, 3° Capital. |
| `/admin/payments/no-pago` | **Bitácora de Reportes de No Pago** | Registro de incidencias en visita (cliente ausente, promesa de pago incumplida, no localización) con evidencia de cobrador. |
| `/admin/payments/transactions` | **Historial de Transacciones Digitales** | Log de transacciones procesadas electrónicamente mediante Openpay o Mercado Pago con estado de webhook. |
| `/admin/collections` | **Centro de Cobranza & Promesas** | Tablero de cartera vencida, segmentación por días de atraso (1-30, 31-60, 60+ días), asignación de rutas a cobradores y seguimiento a Promesas de Pago. |
| `/admin/penalties` | **Recargos y Moratorios Únicos** | Control de cobros por mora, multas fijas diarias, cierres de penalización automáticos y carga manual por sanción extrajudicial. |
| `/admin/commissions` | **Gestión & Liquidación de Comisiones** | Módulo multi-tenant de comisiones para asesores por originación y cobranza. 3 Pestañas (Registros con Selección Múltiple y Batch Approve/Pay, Resumen por Asesor, Creador de Esquemas Porcentaje/Fijo/Tiers). |
| `/admin/reports` | **Centro de Reportes & Exportaciones** | Generación e inmediatez en exportaciones de Excel (`.xlsx`) y PDF en tiempo real. Pestaña de Exportación Instantánea (Cartera, Cobranza, Mora, Clientes), Plantillas Personalizadas, Historial de Descargas y Modal de Parametrización por fecha y asesor. |
| `/admin/reports/collections` | **Reporte de Cobranza de Campo** | Rendimiento de cobradores y desglose de visitas exitosas vs fallidas. |
| `/admin/non-payments` | **Gestión de Impagos Críticos** | Módulo especializado para casos en litigio o pase a cobranza extrajudicial. |

#### 📱 Comunicaciones, Configuración & Módulos
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/whatsapp` | **Centro de Mensajería WhatsApp** | Monitor general del canal de WhatsApp. Muestra estado del bot WAHA y volumen de mensajes enviados. |
| `/admin/whatsapp/config` | **Conexión WAHA / Código QR** | Generación de código QR para vinculación de número de WhatsApp del tenant, estado de la sesión y webhooks. |
| `/admin/whatsapp/clients` | **Chat Directo con Clientes** | Bandeja de entrada estilo WhatsApp Web para enviar recordatorios manuales, responder dudas o recibir comprobantes. |
| `/admin/whatsapp/messages` | **Log de Mensajes Automatizados** | Registro detallado de mensajes salientes (Notificaciones de cobro, avisos de vencimiento, recibos de pago). |
| `/admin/sms` | **Campañas de SMS Transaccionales** | Configuración de pasarela LabsMobile y envío masivo de mensajes SMS de texto. |
| `/admin/message-templates` | **Plantillas de Mensajes** | Edición de plantillas dinámicas con variables (`{nombre}`, `{monto}`, `{fecha_pago}`, `{link_pago}`). |
| `/admin/message-recharges` | **Recarga de Saldo de Mensajería** | Gestión de saldo disponible para envío de SMS y notificaciones de WhatsApp. |
| `/admin/modules` | **Gestión de Módulos PWA** | Habilitación y deshabilitación dinámica de características del sistema por rol. |
| `/admin/users` | **Gestión de Usuarios del Tenant** | Alta, baja, asignación de roles (`ADMIN`, `ASESOR`, `CLIENTE`) y reseteo de contraseñas. |
| `/admin/settings` | **Configuración de la Financiera** | Razón social, RFC, dirección, políticas de crédito y parámetros generales del tenant. |
| `/admin/config/theme` | **Personalización de Marca (White-Labeling)** | Selector visual de colores, picker HEX y vista previa en vivo del tema institucional. |
| `/admin/storage` | **Almacenamiento Dual & Presigned URLs** | Consola de monitoreo de archivos guardados en AWS S3 o servidor local. |
| `/admin/kyc` | **Verificación de Identidad (KYC)** | Módulo de validación de credenciales INE/IFE (OCR), detección de rostros y autenticidad de documentos. |
| `/admin/scoring` | **Motor Predictivo de Scoring (IA)** | Ajuste y monitoreo del algoritmo sigmoide/ML para evaluación del riesgo de mora. |

---

### 💼 Rol 3: ASESOR (Comisionado / Cobrador / Agente de Campo)
*Acceso restringido a los clientes y préstamos bajo su asignación directa.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/asesor/dashboard` | **Dashboard de Asesor** | Resumen de cartera asignada, meta de cobro del día, comisiones acumuladas e indicadores clave. |
| `/asesor/clients` | **Mis Clientes Asignados** | Directorio exclusivo de clientes bajo responsabilidad del asesor con llamadas directas y WhatsApp. |
| `/asesor/loans` | **Mis Préstamos Asignados** | Control de créditos originados o asignados con números cortos para seguimiento de cobro. |
| `/asesor/loans/new` | **Solicitar / Emitir Préstamo** | Captura de solicitudes de crédito en campo para sus clientes. |
| `/asesor/loans/[id]` | **Detalle de Préstamo** | Amortizaciones del crédito y opción de registrar cobro. |
| `/asesor/loans/[id]/edit` | **Modificar Solicitud** | Corrección de datos de la solicitud antes de aprobación. |
| `/asesor/credit-applications` | **Mis Solicitudes de Crédito** | Estado de aprobación de las solicitudes enviadas a mesa de control. |
| `/asesor/simulator` | **Simulador de Crédito** | Calculadora rápida para cotizar montos, plazos y cuotas a clientes prospecto. |
| `/pwa/asesor` | **PWA Asesor Móvil** | Vista optimizada para smartphone con acceso rápido a cobro y directorio de clientes. |

---

### 🙋 Rol 4: CLIENTE (Acreditado / Portal del Cliente)
*Acceso exclusivo a su información crediticia personal.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/cliente/dashboard` | **Portal Mi Cuenta** | Vista del crédito activo, saldo restante, próxima fecha de pago, monto a pagar y botón de pago digital. |
| `/cliente/loans` | **Mis Préstamos** | Historial completo de créditos contratados (Activos y Liquidados). |
| `/cliente/loans/[id]` | **Detalle de Mi Préstamo** | Amortizaciones pagadas/pendientes, descarga de Contrato NOM-151 y Estado de Cuenta PDF. |
| `/cliente/payments` | **Historial de Mis Pagos** | Registro de comprobantes, fechas de pago y recibos digitales. |
| `/cliente/credit-applications` | **Mis Solicitudes de Crédito** | Estatus de solicitudes de crédito ingresadas por el cliente. |
| `/pwa/client` | **PWA Cliente Móvil** | Aplicación web progresiva optimizada para el cliente con opción de instalación PWA. |

---

### 📱 Rol 5: MÓVIL & CAMPO (Cobranza Móvil Offline Sync)
*Optimizado para operaciones en smartphone sin conexión a internet continua.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/mobile/dashboard` | **Panel Móvil de Campo** | Ruta de cobro del día, total a recuperar, cobrado y saldo pendiente. |
| `/mobile/cobranza` | **Módulo de Cobro en Campo** | Registro rápido de abonos en efectivo con geolocalización GPS e impresión/envío de recibo WhatsApp. |
| `/mobile/clients` | **Directorio Móvil de Clientes** | Búsqueda táctil con botón de navegación GPS (Google Maps / Waze) e inicio de llamada. |
| `/mobile/visits` | **Gestión de Visitas de Cobranza** | Registro de rutas de visita y geolocalización de cobradores. |
| `/mobile/visits/new` | **Capturar Nueva Visita / Evidencia** | Fotografía de evidencia, coordenadas GPS y notas de no pago. |
| `/offline` | **Centro de Sincronización Offline** | Pantalla de estado cuando no hay señal de internet con cola de reintentos IndexedDB. |

---

### 🌐 Rol 6: PÚBLICO & AUTENTICACIÓN (Acceso General & API)
*Accesible públicamente sin iniciar sesión.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/` | **Landing Page Principal EscalaFin** | Presentación comercial de la plataforma SaaS, características y planes de precios. |
| `/auth/login` | **Inicio de Sesión Multi-tenant** | Login unificado con autenticación por correo/usuario y contraseña. |
| `/auth/register` | **Registro de Usuario** | Creación de cuenta de usuario. |
| `/auth/register-tenant` | **Onboarding Registro de Empresa (Tenant)** | Formulario de registro de nuevas financieras para prueba gratuita de 14 días. |
| `/auth/forgot-password` | **Recuperación de Contraseña** | Restablecimiento de contraseña por correo electrónico. |
| `/download` | **Descarga de App Móvil (APK / PWA)** | Enlaces directos de instalación para Android (APK) e instrucciones PWA. |
| `/soporte` | **Centro de Ayuda & Contacto** | Enlaces de contacto WhatsApp y soporte técnico. |
| `/legal/privacy` | **Aviso de Privacidad** | Documento legal de privacidad de datos personales. |
| `/legal/terms` | **Términos y Condiciones** | Términos de servicio de la plataforma. |
| `/docs/api` | **Portal Interactivo de API v1** | Documentación Swagger/OpenAPI para desarrolladores externos. |
| `/pwa` | **PWA Launcher** | Redirección inteligente de aplicación web progresiva según rol. |

---

## 📦 3. Módulos del Sistema (Estado Actual de Desarrollo v3.3.0)

| Módulo | Estado | % Avance | Descripción |
|--------|--------|----------|-------------|
| **1. Auth, Roles & RBAC** | ✅ Producción | 100% | Autenticación multi-tenant, 2FA (OTPLib), roles (SuperAdmin, Admin, Asesor, Cliente), middleware RBAC. |
| **2. Gestión de Clientes & Tabs UI**| ✅ Producción | 100% | Expediente 360°, formularios por pestañas en Alta/Edición con colores activos, OCR INE/KYC, scoring inicial, referencias, avales y geolocalización. |
| **3. Motor de Préstamos & NOM-151**| ✅ Producción | 100% | Amortización multimodal, formato de números cortos (`#EF-001`), pestañas con colores activos + **Firma Digital NOM-151** con canvas y trazabilidad SHA-256. |
| **4. Cobranza & Recargos Únicos**| ✅ Producción | 100% | Pagos en caja/campo, pasarelas Openpay/Mercado Pago, recargos automáticos por mora, control `/admin/penalties` y Promesas de Pago. |
| **5. Gestión & Liquidación de Comisiones**| ✅ Producción | 100% | Motor multi-tenant de comisiones, disparadores automáticos en préstamos/pagos, liquidación por lote (Batch Approve/Pay), resumen por asesor y creador de esquemas (Porcentaje, Monto Fijo, Tiers). |
| **6. Centro de Reportes & Exportaciones**| ✅ Producción | 100% | Generación e inmediatez en exportaciones de Excel (`.xlsx`) y PDF en tiempo real, plantillas por defecto por tenant, historial y modal de parametrización. |
| **7. Comunicaciones & WhatsApp Flows**| ✅ Producción | 100% | WhatsApp WAHA, **WhatsApp Flows interactivos**, SMS LabsMobile y Notificaciones Push. |
| **8. PWA & Offline Sync Engine**| ✅ Producción | 100% | App móvil responsiva con Capacitor 8, **Base de datos IndexedDB offline** y cola de reintentos. |
| **9. API Pública v1 & Docs** | ✅ Producción | 100% | Endpoints `/api/v1/loans`, portal `/docs/api` y especificación OpenAPI 3.0. |
| **10. IA Scoring Crediticio** | ✅ Producción | 100% | Modelo predictivo sigmoide para predecir probabilidades de impago entrenado con historial de cartera. |
| **11. PLD (Prevención de Lavado)**| ✅ Producción | 100% | Tamizaje automático contra listas de bloqueados (OFAC, ONU, 69-B SAT), evaluación de riesgo PLD y alertas. |
| **12. SaaS Command Center** | ✅ Producción | 100% | Administración global de tenants, Full Data Purge en cascada, facturación SaaS, impersonación y seguridad. |
| **13. Cloud Storage Dual** | ✅ Producción | 100% | Sistema híbrido de almacenamiento en AWS S3 + almacenamiento local con presigned URLs seguras. |
| **14. Pruebas Automatizadas**| ✅ Producción | 100% | **Suite de pruebas Jest al 100% (6/6 pasadas)** y compilación limpia `tsc` y `npm run build` (0 errores). |

---

## 🚀 4. Historial de Fases de Desarrollo

### ✅ FASE 1: Cimientos Tecnológicos & Multi-tenancy (Completado)
- Migración completa a Redis y PostgreSQL con Prisma ORM.
- Middleware multi-tenant con resolución por subdominio y cabecera HTTP.

### ✅ FASE 2: Motor de Crédito, Cobranza & Pasarelas (Completado)
- Pasarelas electrónicas (**Openpay** y **Mercado Pago**).
- Motor de cálculo de préstamos multimodales y tabla de amortización.

### ✅ FASE 3: Comunicaciones & WhatsApp Flows (Completado)
- **WAHA API** y **WhatsApp Flows interactivos** para solicitudes expres y promesas de pago.
- Campañas de SMS masivos con **LabsMobile**.

### ✅ FASE 4: Firma Digital NOM-151, Offline Sync & API v1 (Completado Q3 2026)
- **Constancia de Conservación NOM-151** con firmas digitales en canvas HTML5 y coordenadas GPS.
- **Offline Sync Engine nativo IndexedDB** para operaciones de cobro sin señal.
- **API Pública v1** y Portal de Desarrolladores interactivo en `/docs/api` con especificación OpenAPI 3.0.
- **Suite de pruebas unitarias Jest (6/6 pasadas)**.

### ✅ FASE 5: White-labeling Dinámico (Completado Q4 2026)
- **Motor de White-labeling dinámico** (`app/lib/white-label-service.ts`): Conversión HEX→HSL, generación de variables CSS por tenant, 5 paletas preestablecidas.
- **Componente ThemeInjector** (`app/components/theme-injector.tsx`): Inyección dinámica en `<head>` sin recarga de página.
- **Panel de Administración** en `/admin/config/theme`: Selector visual de colores, picker HEX y vista previa en vivo estilo glassmorphic.

### ✅ FASE 6: Performance Engine v1 (Completado Q4 2026)
- **8 índices compuestos** aplicados directamente en PostgreSQL 17.10 de producción (`CONCURRENTLY`) sobre `loans`, `payments` y `amortization_schedule`.
- **Caché Redis/Memory con stale-while-revalidate** (`app/lib/performance.ts`): `cachedQuery()` con fallback automático en memoria.
- **Selectores Prisma optimizados** (`app/lib/prisma-selects.ts`): `loanListSelect`, `loanDetailSelect`, `clientListSelect`, `paymentListSelect` — reduce payload hasta **70%**.
- **Code Splitting de Recharts** (`app/components/charts/dynamic-recharts.ts`): ~350KB cargados solo en cliente vía `next/dynamic({ ssr: false })`.
- **Skeleton Screens** (`app/components/ui/skeletons.tsx`): 6 variantes (Dashboard, LoanTable, LoanDetail, ClientList, PaymentForm, MobileDashboard).

### ✅ FASE 7: Form Tabs, Comisiones Multi-Tenant & Centro de Reportes (Completado v3.3.0 - Agosto 2026)
- **Formularios & Detalle por Pestañas con Colores Activos**:
  - Clientes (`/admin/clients/new`, `/admin/clients/[id]`, `/admin/clients/[id]/edit`) y Préstamos (`/admin/loans/[id]`) con pestañas temáticas destacadas en negrita y sombras activas.
- **Gestión & Liquidación de Comisiones (`/admin/commissions`)**:
  - Motor backend multi-tenant `commissionService` con `getTenantPrisma`.
  - Disparadores automáticos por originación de préstamo y por cobranza de pago.
  - Pestaña de Liquidación en Lote (Batch Approve/Pay por checkboxes), Resumen por Asesor y Modal Creador de Esquemas (Porcentaje, Fijo, Tiers).
- **Centro de Reportes & Exportaciones (`/admin/reports`)**:
  - Exportaciones instantáneas en **Excel (`.xlsx`)** y **PDF** con diseño ejecutivo.
  - Auto-inicialización de 4 plantillas por tenant.
  - Modal de parametrización por rango de fechas, asesor y estado.
- **Números Cortos de Préstamo (`#EF-001`)**:
  - Formato simplificado en badges para visualización limpia en listas, detalles y estados de cuenta.

---

## 🚧 5. Hoja de Ruta Estratégica (Roadmap Q4 2026 / 2027)

### 📱 Prioridad Media (Q4 2026)
- [x] **White-labeling Dinámico Avanzado**: ✅ Implementado — Inyección de variables CSS por tenant + panel `/admin/config/theme`.
- [x] **Performance Engine v1**: ✅ Implementado — Índices DB, caché, code splitting, skeleton screens.
- [x] **Gestión & Liquidación de Comisiones**: ✅ Implementado — Motor multi-tenant, batch actions y disparadores automáticos.
- [x] **Centro de Reportes & Exportaciones**: ✅ Implementado — Excel (.xlsx), PDF, plantillas por defecto y filtros en vivo.
- [ ] **Predictive AI Collections Route**: Motor de IA para optimización de rutas de visita en campo que sugiere la hora óptima para encontrar al cliente según su patrón histórico.
- [ ] **Programa de Lealtad & Gamificación**: Sistema de puntos, insignias y reducciones de tasa para acreditados con historial de pago puntual.
- [ ] **Webhooks Salientes v1**: Sistema de eventos salientes (`loan.created`, `payment.received`, `client.blacklisted`) para integraciones ERP/CRM.

### 🌐 Prioridad Baja (2027)
- [ ] **Multi-tenancy Físico (Isolated DB per Tenant)**: Opción de aislamiento físico de base de datos PostgreSQL dedicada para clientes corporativos / Enterprise.
- [ ] **Aplicación Móvil Nativa iOS (App Store)**: Publicación oficial de la app compilada en la App Store de Apple.
- [ ] **Marketplace de Colaterales & Garantías**: Módulo para la gestión y subasta interna de bienes empeñados o en garantía.

---

## 🔧 6. Notas de Despliegue e Infraestructura (v3.3.0)

- **Versión de Producción**: `3.3.0`
- **Docker Build**: Debian 12 Bookworm Slim, Node.js 20.x, Next.js standalone output.
- **Base de Datos**: PostgreSQL **17.10** — 2 tenants activos, 69 clientes, 68 préstamos, 531 pagos, 128 cuotas de amortización.
- **Estado de Pruebas**: 100% pasadas, 0 errores TypeScript y compilación exitosa `npm run build`.
- **GitHub Commit**: `b885524` (Sincronizado en `main`).
