# 🗺️ Roadmap Unificado y Catálogo de Páginas por Rol - EscalaFin

Este documento constituye la **única fuente de verdad** para la arquitectura, el estado del sistema, el catálogo exhaustivo de páginas y funciones clasificadas por rol de usuario, y la planificación futura de **EscalaFin**.

**Última Actualización**: Agosto 2026  
**Versión Actual del Sistema**: `3.1.0`  
**Estado General**: Producción (SaaS Multi-tenant / Enterprise Ready)

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

### Core Stack
- **Frontend Framework**: Next.js 14.2.28 (App Router), React 18.2, TypeScript 5.2, Tailwind CSS 3.3, Radix UI primitives, Lucide Icons, Framer Motion.
- **Backend & API**: Next.js API Routes (Node.js 20.x runtime), Middleware de resolución multi-tenant y RBAC. API Pública v1 con autenticación por `X-API-Key`.
- **ORM & Base de Datos**: Prisma ORM `6.7.0`, PostgreSQL **17.10** con aislamiento dinámico por `tenantId`. **8 índices compuestos de rendimiento** aplicados en producción (`loans`, `payments`, `amortization_schedule`).
- **Caché & Colas**: Redis 7.x con capa de caché Memory Fallback + stale-while-revalidate (`app/lib/performance.ts`).
- **Móvil & PWA**: Capacitor 8.2 (Android/iOS builds) + Progressive Web App con **Offline Sync Engine nativo IndexedDB**.
- **Integraciones de Comunicación**: WAHA API (WhatsApp Webhook Engine), **WhatsApp Flows Interactivos**, LabsMobile API (SMS Transaccionales), Web Push Notifications.
- **Seguridad & Firma Digital**: Constancia de conservación **NOM-151** con hash SHA-256, estampa de tiempo e IP/GPS.
- **Pasarelas de Pago**: Openpay (Tarjetas/SPEI/Conveniencia), Mercado Pago (Checkout Pro y Subscripciones SaaS).
- **Monitoreo & Archivos**: Sentry SDK (`^10.38.0`), AWS S3 SDK (`^3.893.0`) + Almacenamiento Local Dual.

---

## 👤 2. Clasificación de Páginas y Funciones por Rol de Usuario

El sistema cuenta con más de **80 páginas y vistas** organizadas jerárquicamente por el rol de acceso asignado (`UserRole`).

---

### 🛡️ Rol: SUPER_ADMIN (Command Center SaaS)
*Acceso exclusivo para los administradores globales de la plataforma EscalaFin.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/saas` | **Dashboard Maestro SaaS** | Muestra el MRR (Monthly Recurring Revenue), total de tenants activos/suspendidos, volumen de crédito procesado a nivel global y métricas de churn. |
| `/admin/saas/tenants` | **Gestión Global de Tenants** | Lista general de empresas registradas. Permite crear tenants, cambiar planes, suspender accesos y ejecutar el **Full Data Purge** (borrado seguro en cascada compliance). |
| `/admin/saas/tenants/[id]/users` | **Control de Usuarios por Tenant** | Administra los usuarios pertenecientes a una organización específica directamente desde la consola maestra. |
| `/admin/saas/security` | **Seguridad Global & Rate Limiting** | Monitor de seguridad de la plataforma, lista negra de IPs, intentos fallidos de login y auditoría de accesos sensibles. |
| `/admin/saas/settings` | **Configuración Maestra SaaS** | Ajustes globales del sistema, conexión centralizada del motor WAHA/WhatsApp para notificaciones de la plataforma y credenciales de cobro SaaS. |
| `/admin/super-users` | **Gestión de Administradores SaaS** | Alta, baja y asignación de privilegios para usuarios con rol `SUPER_ADMIN`. |

---

### 🏢 Rol: ADMIN (Administrador de Financiera / Tenant)
*Acceso completo a la operación, finanzas, personal y clientes de la organización.*

#### 📊 Dashboard y Métricas
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/dashboard` | **Dashboard Ejecutivo** | Resumen operativo del tenant: Cartera activa, recuperación diaria/semanal, tasa de morosidad, solicitudes pendientes y saldo disponible. |
| `/admin/analytics` | **Analítica Financiera Avanzada** | Gráficas interactivas con Chart.js/Recharts sobre comportamiento de pago, proyección de flujo de caja y rentabilidad de cartera. |
| `/admin/audit` | **Logs de Auditoría** | Trazabilidad completa de acciones realizadas por el personal (creación de créditos, cobros, modificaciones de tasa, cancelaciones). |

#### 👥 Clientes y Solicitudes
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/clients` | **Directorio de Clientes** | Lista de acreditados con búsqueda avanzada, filtro por estatus (Activo, Inactivo, Lista Negra, Bloqueado PLD) y scoring. |
| `/admin/clients/new` | **Alta de Cliente** | Formulario de registro con captura de INE/KYC, comprobantes, avales, referencias personales y geolocalización de domicilio. |
| `/admin/clients/migrate` | **Migración Masiva desde Excel** | Herramienta de importación masiva de cartera histórica desde archivos `.xlsx`/`.csv` con validación de duplicados. |
| `/admin/clients/[id]` | **Expediente 360° del Cliente** | Expediente digital unificado: Historial crediticio, tabla de amortizaciones activas, documentos digitalizados, scorecard e historial de pagos. |
| `/admin/clients/[id]/edit` | **Edición de Datos de Cliente** | Modificación de información personal, contacto, domicilio o referencias del cliente. |
| `/admin/credit-applications` | **Módulo de Solicitudes de Crédito** | Evaluación de nuevas solicitudes. Permite aprobar, rechazar, solicitar ajustes o enviar a revisión de comisionado. |

#### 💵 Préstamos y Motor de Crédito
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/loans` | **Gestión de Préstamos** | Control total de cartera: Préstamos Activos, Liquidados, En Morosidad, Refinanciados y Cancelados. |
| `/admin/loans/new` | **Originación de Crédito** | Simulador y emisor de préstamos. Soporta Interés Simple, Tarifa Fija, Interés Semanal y modelo Por Mil ($120/mil). Generación de Pagaré Digital NOM-151. |
| `/admin/loans/[id]` | **Detalle de Préstamo** | Visión detallada del crédito, amortizaciones pagadas/pendientes, cálculo automático de recargos, contrato con firma digital y recibos PDF. |
| `/admin/loans/[id]/edit` | **Reestructuración de Crédito** | Ajuste extraordinario de plazos, condonación de recargos o modificación de condiciones aprobadas. |
| `/admin/weekly-interest-rates` | **Configuración de Tasas Semanales** | Matriz de ajuste dinámico de tasas de interés y descuentos por nivel de riesgo del cliente. |

#### 💳 Cobranza y Recargos
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/payments` | **Registro y Recepción de Pagos** | Captura manual de abonos en efectivo, transferencias bancarias, cheques y conciliación de fichas de depósito. |
| `/admin/payments/new` | **Alta de Abono Individual / Lote** | Registro rápido de cobro aplicando lógica de prelación: 1° Recargos, 2° Interés, 3° Capital. |
| `/admin/payments/no-pago` | **Bitácora de Reportes de No Pago** | Registro de incidencias en visita (cliente ausente, promesa de pago incumplida, no localización) con evidencia de cobrador. |
| `/admin/payments/transactions` | **Historial de Transacciones Digitales** | Log de transacciones procesadas electrónicamente mediante Openpay o Mercado Pago con estado de webhook. |
| `/admin/collections` | **Centro de Cobranza & Promesas** | Tablero de cartera vencida, segmentación por días de atraso (1-30, 31-60, 60+ días), asignación de rutas a cobradores y seguimiento a Promesas de Pago. |
| `/admin/penalties` | **Recargos y Moratorios** | Configuración de reglas de recargos por mora (Monto Fijo Diario, Porcentaje sobre Saldo Vencido) y aplicación masiva. |
| `/admin/non-payments` | **Gestión de Impagos Críticos** | Módulo especializado para casos en litigio o pase a cobranza extrajudicial. |

#### 📱 Comunicaciones (WhatsApp & SMS)
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/whatsapp` | **Centro de Mensajería WhatsApp** | Monitor general del canal de WhatsApp. Muestra estado del bot WAHA y volumen de mensajes enviados. |
| `/admin/whatsapp/config` | **Conexión WAHA / Código QR** | Generación de código QR para vinculación de número de WhatsApp del tenant, estado de la sesión y webhooks. |
| `/admin/whatsapp/clients` | **Chat Directo con Clientes** | Bandeja de entrada estilo WhatsApp Web para enviar recordatorios manuales, responder dudas o recibir comprobantes. |
| `/admin/whatsapp/messages` | **Log de Mensajes Automatizados** | Registro detallado de mensajes salientes (Notificaciones de cobro, avisos de vencimiento, recibos de pago). |
| `/admin/sms` | **Campañas de SMS Transaccionales** | Configuración de pasarela LabsMobile y envío masivo de mensajes SMS de texto. |
| `/admin/message-templates` | **Plantillas de Mensajes** | Edición de plantillas dinámicas con variables (`{nombre}`, `{monto}`, `{fecha_pago}`, `{link_pago}`). |
| `/admin/message-recharges` | **Recarga de Saldo de Mensajería** | Gestión de saldo disponible para envío de SMS y notificaciones de WhatsApp. |

#### 🔌 Integraciones & Documentación de Desarrolladores
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/docs/api` | **Developer Portal API v1** | Interfaz interactiva de documentación con probador cURL, límites de velocidad y ejemplos de integración. |
| `/api/v1/docs` | **Especificación OpenAPI 3.0** | Endpoint dinámico JSON con el esquema de OpenAPI 3.0 para desarrollo e integración externa. |
| `/api/v1/loans` | **API Pública de Préstamos** | Endpoint seguro con autenticación por `X-API-Key` o `Bearer Token` para consulta de cartera y amortizaciones. |

#### 🤖 Inteligencia Artificial & Prevención (IA / PLD / KYC)
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/scoring` | **Motor Predictivo de Scoring (IA)** | Ajuste y monitoreo del algoritmo sigmoide/ML para evaluación del riesgo de mora del prospecto antes del desembolso. |
| `/admin/kyc` | **Verificación de Identidad (KYC)** | Módulo de validación de credenciales INE/IFE (OCR), detección de rostros y autenticidad de documentos subidos. |
| (Backoffice PLD) | **Prevención de Lavado de Dinero** | Tamizaje en listas de bloqueados (OFAC, ONU, 69-B SAT), cálculo de perfil transaccional y alertas por operaciones inusuales. |

---

## 📦 3. Módulos del Sistema (Estado Actual de Desarrollo)

| Módulo | Estado | % Avance | Descripción |
|--------|--------|----------|-------------|
| **1. Auth, Roles & RBAC** | ✅ Producción | 100% | Autenticación multi-tenant, 2FA (OTPLib), roles (SuperAdmin, Admin, Asesor, Cliente), middleware RBAC. |
| **2. Gestión de Clientes** | ✅ Producción | 100% | Expediente 360°, OCR INE/KYC, scoring inicial, referencias, avales y geolocalización. |
| **3. Motor de Préstamos & NOM-151**| ✅ Producción | 100% | Amortización multimodal + **Firma Digital NOM-151** con canvas y trazabilidad SHA-256. |
| **4. Cobranza & Recargos** | ✅ Producción | 100% | Pagos en caja/campo, pasarelas Openpay/Mercado Pago, recargos automáticos por mora y Promesas de Pago. |
| **5. Comunicaciones & WhatsApp Flows**| ✅ Producción | 100% | WhatsApp WAHA, **WhatsApp Flows interactivos**, SMS LabsMobile y Notificaciones Push. |
| **6. PWA & Offline Sync Engine**| ✅ Producción | 100% | App móvil responsiva con Capacitor 8, **Base de datos IndexedDB offline** y cola de reintentos. |
| **7. API Pública v1 & Docs** | ✅ Producción | 100% | Endpoints `/api/v1/loans`, portal `/docs/api` y especificación OpenAPI 3.0. |
| **8. IA Scoring Crediticio** | ✅ Producción | 100% | Modelo predictivo sigmoide para predecir probabilidades de impago entrenado con historial de cartera. |
| **9. PLD (Prevención de Lavado)**| ✅ Producción | 100% | Tamizaje automático contra listas de bloqueados (OFAC, ONU, 69-B SAT), evaluación de riesgo PLD y alertas. |
| **10. SaaS Command Center** | ✅ Producción | 100% | Administración global de tenants, Full Data Purge en cascada, facturación SaaS, impersonación y seguridad. |
| **11. Cloud Storage Dual** | ✅ Producción | 100% | Sistema híbrido de almacenamiento en AWS S3 + almacenamiento local con presigned URLs seguras. |
| **12. Pruebas Automatizadas**| ✅ Producción | 100% | **Suite de pruebas Jest al 100% (6/6 pasadas)** para Firma NOM-151 y WhatsApp Flows. |

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
- **`next.config.js` optimizado**: HTTP Security Headers, caché de assets estáticos 1 año (immutable), imágenes AVIF/WebP, `optimizePackageImports` para tree-shaking.

---

## 🚧 5. Hoja de Ruta Estratégica (Roadmap Q4 2026 / 2027)

### 📱 Prioridad Media (Q4 2026)
- [x] **White-labeling Dinámico Avanzado**: ✅ Implementado — Inyección de variables CSS por tenant + panel `/admin/config/theme`.
- [x] **Performance Engine v1**: ✅ Implementado — Índices DB, caché, code splitting, skeleton screens.
- [ ] **Predictive AI Collections Route**: Motor de IA para optimización de rutas de visita en campo que sugiere la hora óptima para encontrar al cliente según su patrón histórico.
- [ ] **Programa de Lealtad & Gamificación**: Sistema de puntos, insignias y reducciones de tasa para acreditados con historial de pago puntual.
- [ ] **Webhooks Salientes v1**: Sistema de eventos salientes (`loan.created`, `payment.received`, `client.blacklisted`) para integraciones ERP/CRM.

### 🌐 Prioridad Baja (2027)
- [ ] **Multi-tenancy Físico (Isolated DB per Tenant)**: Opción de aislamiento físico de base de datos PostgreSQL dedicada para clientes corporativos / Enterprise.
- [ ] **Aplicación Móvil Nativa iOS (App Store)**: Publicación oficial de la app compilada en la App Store de Apple.
- [ ] **Marketplace de Colaterales & Garantías**: Módulo para la gestión y subasta interna de bienes empeñados o en garantía.

---

## 🔧 6. Notas de Despliegue e Infraestructura (v3.1.0)

- **Versión de Producción**: `3.1.0`
- **Docker Build**: Debian 12 Bookworm Slim, Node.js 20.x, Next.js standalone output.
- **Base de Datos**: PostgreSQL **17.10** — 2 tenants activos, 69 clientes, 68 préstamos, 531 pagos, 128 cuotas de amortización.
- **Índices de Rendimiento**: 18 índices activos (8 compuestos nuevos aplicados directamente en producción `CONCURRENTLY`).
- **Estado de Pruebas**: 100% pasadas (Jest Suite 6/6).
- **GitHub Commit**: `face42a` (Sincronizado en `main`).
- **Canal de Soporte de la Plataforma**: WhatsApp directo `4424000742`.
