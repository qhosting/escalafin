# 🗺️ Roadmap Unificado y Catálogo de Páginas por Rol - EscalaFin

Este documento constituye la **única fuente de verdad** para la arquitectura, el estado del sistema, el catálogo exhaustivo de páginas y funciones clasificadas por rol de usuario, y la planificación futura de **EscalaFin**.

**Última Actualización**: Agosto 2026  
**Versión Actual del Sistema**: `3.0.0`  
**Estado General**: Producción (SaaS Multi-tenant / Enterprise Ready)

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

### Core Stack
- **Frontend Framework**: Next.js 14.2.28 (App Router), React 18.2, TypeScript 5.2, Tailwind CSS 3.3, Radix UI primitives, Lucide Icons, Framer Motion.
- **Backend & API**: Next.js API Routes (Node.js 20.x runtime), Middleware de resolución multi-tenant y RBAC.
- **ORM & Base de Datos**: Prisma ORM `6.7.0`, PostgreSQL 15 con aislamiento dinámico por `tenantId`.
- **Caché & Colas**: Redis 7.x (Sesiones, Rate Limiting, colas de notificaciones BullMQ/Workers).
- **Móvil & PWA**: Capacitor 8.2 (Android/iOS builds) + Progressive Web App (Service Workers, Offline Caching).
- **Integraciones de Comunicación**: WAHA API (WhatsApp Webhook Engine), LabsMobile API (SMS Transaccionales), Web Push Notifications.
- **Pasarelas de Pago**: Openpay (Tarjetas/SPEI/Conveniencia), Mercado Pago (Checkout Pro y Subscripciones SaaS).
- **Monitoreo & Archivos**: Sentry SDK (`^10.38.0`), AWS S3 SDK (`^3.893.0`) + Almacenamiento Local Dual.

### Estrategia Multi-tenancy
El sistema utiliza una arquitectura de **aislamiento de datos por identificador (`tenantId`)**:
1. **Resolución de Subdominio / Cabecera**: `cliente.escalafin.com` o `X-Tenant-ID` se resuelven dinámicamente en `middleware.ts`.
2. **Capa de Datos Segura**: `getTenantPrisma(tenantId)` inyecta automáticamente filtros en cada consulta SQL/Prisma.
3. **Bloqueo Cross-Tenant**: Validación en Middleware para impedir fugas de información entre organizaciones.
4. **Command Center SaaS**: El rol `SUPER_ADMIN` opera a nivel global sobre la tabla `tenants` y suscripciones de la plataforma.

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
| `/admin/loans/new` | **Originación de Crédito** | Simulador y emisor de préstamos. Soporta Interés Simple, Tarifa Fija, Interés Semanal y modelo Por Mil ($120/mil). Generación de Pagaré Digital. |
| `/admin/loans/[id]` | **Detalle de Préstamo** | Visión detallada del crédito, amortizaciones pagadas/pendientes, cálculo automático de recargos, contrato y generación de recibos PDF. |
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

#### 🤖 Inteligencia Artificial & Prevención (IA / PLD / KYC)
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/scoring` | **Motor Predictivo de Scoring (IA)** | Ajuste y monitoreo del algoritmo sigmoide/ML para evaluación del riesgo de mora del prospecto antes del desembolso. |
| `/admin/kyc` | **Verificación de Identidad (KYC)** | Módulo de validación de credenciales INE/IFE (OCR), detección de rostros y autenticidad de documentos subidos. |
| (Backoffice PLD) | **Prevención de Lavado de Dinero** | Tamizaje en listas de bloqueados (OFAC, ONU, 69-B SAT), cálculo de perfil transaccional y alertas por operaciones inusuales. |

#### 📈 Reportes, Personal y Configuración del Tenant
| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/admin/reports` | **Hub de Reportes Financieros** | Generación y descarga en Excel (`.xlsx`) y PDF de Carteras, Colocación, Recuperación, Comisiones e Impuestos. |
| `/admin/reports/collections` | **Reporte de Efectividad de Cobranza** | Métricas de desempeño por cobrador en campo, rutas completadas y efectividad de visita. |
| `/admin/users` | **Gestión de Personal & Roles** | Control de acceso para colaboradores del tenant (Admins, Asesores, Cobradores). Asignación de rutas geográficas. |
| `/admin/commissions` | **Cálculo de Comisiones** | Asignación y liquidación de comisiones para asesores por originación de crédito o cobranza efectiva. |
| `/admin/config` | **Configuración General del Negocio** | Logotipo del tenant, razón social, teléfonos de contacto, horarios y preferencias generales. |
| `/admin/config/loans` | **Reglas del Motor de Crédito** | Definición de políticas: montos mínimos/máximos, plazos permitidos, comisiones por apertura y tipos de cálculo. |
| `/admin/modules` | **Activación de Módulos SaaS** | Enciende o apaga módulos según la suscripción (ej. WhatsApp Bot, PLD, IA Scoring, Cobranza Móvil). |
| `/admin/storage` | **Gestión de Almacenamiento Dual** | Monitoreo de espacio en disco/AWS S3 y configuración del sistema de expedientes. |
| `/admin/files` | **Administrador de Expedientes** | Explorador de archivos digitales subidos en la plataforma. |
| `/admin/tenants` | **Ajustes de Organización Tenant** | Parámetros específicos del tenant. |
| `/admin/settings` | **Ajustes Generales del Sistema** | Preferencias secundarias. |
| `/admin/billing` | **Facturación y Plan SaaS** | Estado del plan SaaS actual del tenant, consumo de recursos y consumo de folios. |
| `/admin/billing/subscription` | **Suscripción Activa** | Selección y cambio de plan SaaS (Basic, Pro, Enterprise). |
| `/admin/billing/checkout-simulation` | **Pasarela de Pago SaaS** | Proceso de pago de la renta mensual de la plataforma vía Openpay / Mercado Pago. |

---

### 💼 Rol: ASESOR (Promotor de Crédito y Cobrador de Campo)
*Interfaz optimizada para la operación diaria de agentes en campo y asesores de sucursal.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/asesor/dashboard` | **Panel Operativo Diario** | Resumen individual: Solicitudes del día, metas de colocación, cobros programados en su ruta y comisiones acumuladas. |
| `/asesor/clients` | **Cartera de Clientes Asignados** | Directorio rápido de los acreditados pertenecientes a la ruta o sucursal del asesor. |
| `/asesor/loans` | **Préstamos de su Cartera** | Consulta del estado de los préstamos gestionados por el asesor. |
| `/asesor/loans/new` | **Captura de Solicitud de Crédito** | Formulario ágil para registrar prospectos en campo, tomar fotos de INE/Comprobante y enviar a aprobación. |
| `/asesor/loans/[id]` | **Detalle de Crédito para Cobro** | Consulta de cuotas pendientes y saldo al día para cobro presencial. |
| `/asesor/loans/[id]/edit` | **Edición de Solicitud en Borrador** | Corrección de datos requeridos por el área de crédito antes de la aprobación. |
| `/asesor/credit-applications` | **Seguimiento a Solicitudes** | Estado en tiempo real de las solicitudes enviadas (Pendiente, En Revisión, Aprobada, Rechazada). |
| `/asesor/simulator` | **Simulador de Créditos Expres** | Cotizador rápido para mostrar al cliente cuotas, plazos y total a pagar según el producto crediticio. |

---

### 📱 Rol: COBRADOR / MÓVIL PWA (Operación en Ruta Offline/GPS)
*Rutas optimizadas para dispositivos móviles con baja o nula conectividad a internet.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/mobile/dashboard` | **Home Móvil Responsivo** | Menú táctil simplificado para cobradores con botones de acceso directo a Ruta del Día y Registro de Pago. |
| `/mobile/clients` | **Directorio Móvil con Mapa** | Ubicación en mapa (Mapbox) de los clientes a visitar en la jornada con acceso a llamada directa. |
| `/mobile/cobranza` | **Registro Rápido de Cobro en Campo** | Captura de abono en efectivo con emisión instantánea de recibo digital (WhatsApp/Impresora Bluetooth) y coordenadas GPS. |
| `/mobile/visits` | **Ruta de Visitas Asignada** | Lista de domicilios a visitar ordenados por algoritmo de cercanía (Nearest Neighbor). |
| `/mobile/visits/new` | **Registro de Evidencia de Visita** | Captura de foto de fachada, nota de voz o motivo de no pago con sello de tiempo y ubicación GPS obligatoria. |
| `/pwa` | **Portal PWA Offline Ready** | Shell de la Progressive Web App para instalación en la pantalla de inicio del smartphone. |
| `/pwa/asesor` | **Vista PWA Asesor** | Interfaz ligera de consultas para asesores. |
| `/pwa/client` | **Vista PWA Cliente** | Interfaz ligera para acreditados. |
| `/pwa/reports` | **Reporte Rápido PWA** | Resumen de cierre de caja diario en campo. |

---

### 👤 Rol: CLIENTE (Acreditado / Portal de Autogestión)
*Portal para que el cliente consulte sus créditos y realice sus pagos de forma autónoma.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/cliente/dashboard` | **Mi Estado de Cuenta** | Pantalla principal para el cliente: Muestra su saldo actual, fecha límite de pago, cuota sugerida y botón "Pagar Ahora". |
| `/cliente/loans` | **Mis Préstamos** | Historial de créditos contratados con el tenant (Activos y Finalizados). |
| `/cliente/loans/[id]` | **Detalle de mi Préstamo** | Tabla de amortización detallada, desglose de cuotas e historial de recibos emitidos. |
| `/cliente/payments` | **Pagar en Línea** | Pasarela integrada para realizar abonos mediante Mercado Pago, Openpay (Tarjeta de Débito/Crédito) o generar ficha de pago SPEI/OXXO. |
| `/cliente/credit-applications` | **Solicitar Nuevo Crédito** | Permite a clientes con buen historial solicitar una renovación o ampliación de crédito directamente desde su cuenta. |
| `/client/credit-applications` | **Ruta de Solicitud Secundaria** | Redirección de conveniencia para la captura de solicitudes por cliente. |

---

### 🌐 Rol: PÚBLICO / AUTENTICACIÓN (Acceso Abierto y Seguridad)
*Páginas accesibles sin necesidad de autenticación previa o para gestión de credenciales.*

| Ruta (`app/app/*`) | Función Principal | Componentes y Capacidades Clave |
|--------------------|-------------------|---------------------------------|
| `/` | **Landing Page Principal** | Presentación comercial de EscalaFin, calculadora interactiva, planes SaaS y botón de contacto. |
| `/auth/login` | **Inicio de Sesión Unificado** | Login con correo y contraseña. Detecta el tenant por subdominio, valida 2FA si está habilitado y redirige al dashboard del rol correspondiente. |
| `/auth/register` | **Registro de Usuario** | Formulario para registro de colaboradores con código de invitación. |
| `/auth/register-tenant` | **Onboarding de Nuevo Tenant SaaS** | Formulario para que una nueva financiera cree su cuenta en la plataforma e inicie su prueba gratuita de 14 días. |
| `/auth/forgot-password` | **Recuperación de Contraseña** | Envio de enlace seguro tokenizado para restablecimiento de clave. |
| `/download` | **Descarga de App Móvil** | Página de descarga directa del APK Android o instrucciones de instalación PWA. |
| `/legal/terms` | **Términos y Condiciones** | Marco legal y términos del servicio SaaS EscalaFin. |
| `/legal/privacy` | **Aviso de Privacidad** | Política de tratamiento de datos personales conforme a la regulación. |
| `/soporte` | **Centro de Ayuda / Soporte** | Formulario de tickets de soporte técnico y enlace directo al bot de ayuda en WhatsApp (`4424000742`). |
| `/offline` | **Página Fallback Offline** | Pantalla que se muestra en la PWA cuando se pierde por completo la conexión a internet. |
| `/profile` | **Perfil de Usuario** | Configuración del perfil de cualquier usuario autenticado: cambio de clave, activación de 2FA y foto. |
| `/notifications` | **Centro de Notificaciones** | Historial de alertas in-app recibidas por el usuario. |

---

## 📦 3. Módulos del Sistema (Estado Actual de Desarrollo)

| Módulo | Estado | % Avance | Descripción |
|--------|--------|----------|-------------|
| **1. Auth, Roles & RBAC** | ✅ Producción | 100% | Autenticación multi-tenant, 2FA (OTPLib), roles (SuperAdmin, Admin, Asesor, Cliente), middleware RBAC. |
| **2. Gestión de Clientes** | ✅ Producción | 100% | Expediente 360°, OCR INE/KYC, scoring inicial, referencias, avales y geolocalización. |
| **3. Motor de Préstamos** | ✅ Producción | 100% | Cálculo de Interés Simple, Tarifa Fija, Interés Semanal y Por Mil ($120/mil). Amortizaciones automáticas. |
| **4. Cobranza & Recargos** | ✅ Producción | 100% | Pagos en caja/campo, pasarelas Openpay/Mercado Pago, recargos automáticos por mora y Promesas de Pago. |
| **5. Comunicaciones (WAHA/SMS)** | ✅ Producción | 100% | Integración WhatsApp WAHA bidireccional, bot de cobranza, SMS con LabsMobile y Notificaciones Push. |
| **6. PWA & Operación Móvil** | ✅ Producción | 100% | App móvil responsiva con Capacitor 8, modo offline parcial, mapa de rutas GPS y evidencias de visita. |
| **7. PLD (Prevención de Lavado)**| ✅ Producción | 100% | Tamizaje automático contra listas de bloqueados (OFAC, ONU, 69-B SAT), evaluación de riesgo PLD y alertas. |
| **8. IA Scoring Crediticio** | ✅ Producción | 100% | Modelo predictivo sigmoide para predecir probabilidades de impago entrenado con historial de cartera. |
| **9. Reportes & Exportación** | ✅ Producción | 100% | Exportación en Excel (`.xlsx`) y PDF de estados de cuenta, carteras vencidas, balance general y recuperaciones. |
| **10. SaaS Command Center** | ✅ Producción | 100% | Administración global de tenants, Full Data Purge en cascada, facturación SaaS, impersonación y seguridad. |
| **11. Cloud Storage Dual** | ✅ Producción | 100% | Sistema híbrido de almacenamiento en AWS S3 + almacenamiento local con presigned URLs seguras. |
| **12. Comisiones & Cobradores** | ✅ Producción | 100% | Matriz de cálculo de comisiones por colocado/recuperado y seguimiento a rendimiento de asesores. |

---

## 🚀 4. Historial de Fases de Desarrollo

### ✅ FASE 1: Cimientos Tecnológicos & Multi-tenancy (Completado)
- Migration completa de MongoDB/Legacy a Redis y PostgreSQL con Prisma ORM.
- Implementación del middleware multi-tenant con resolución por subdominio y cabecera HTTP.
- Desarrollo del sistema RBAC con 4 roles principales (`SUPER_ADMIN`, `ADMIN`, `ASESOR`, `CLIENTE`).

### ✅ FASE 2: Motor de Crédito, Cobranza & Pasarelas (Completado)
- Integración de pasarelas de pago electrónicas (**Openpay** y **Mercado Pago**).
- Motor de cálculo de préstamos multimodales (Interés Simple, Tarifa Fija, Semanal, Por Mil).
- Sistema automático de generación de amortizaciones y prelación de cobro.

### ✅ FASE 3: Comunicaciones & Automatizaciones (Completado)
- Conexión del motor **WAHA (WhatsApp HTTP API)** para mensajería bidireccional y automatizada.
- Campañas de SMS masivos mediante la API de **LabsMobile**.
- Cron jobs automáticos para backups cifrados en Google Drive, generación de reportes semanales y limpieza de registros temporales.

### ✅ FASE 4: Inteligencia de Negocio, PLD & PWA Móvil (Completado)
- Modelo de **IA Scoring Crediticio** basado en regresión sigmoide para estimar la probabilidad de incumplimiento.
- Módulo **PLD (Prevención de Lavado de Dinero)** para cumplimiento normativo y tamizaje de listas restrictivas.
- Aplicación **PWA Móvil con Capacitor 8** para cobradores y asesores en campo con geolocalización GPS.

### ✅ FASE 5: SaaS Command Center & Security Upgrade (Completado Q2 2026)
- Creación de la consola **Super Admin Command Center** para gestión centralizada del ecosistema SaaS.
- Función de **Full Data Purge**: borrado en cascada con cumplimiento de normativas de privacidad y eliminación segura de tenancies.
- Monitoreo global de salud del sistema, gestión de suscripciones SaaS y auditoría de accesos.

---

## 🚧 5. Hoja de Ruta Estratégica (Roadmap Q3-Q4 2026 / 2027)

### 📈 Prioridad Alta (Q3 2026)
- [ ] **Offline Sync Engine v2 (IndexedDB + PWA)**: Sistema de sincronización bidireccional en segundo plano para agentes en campo que operan en zonas rurales sin señal celular.
- [ ] **API Pública v1 & Developer Portal**: Documentación Swagger/OpenAPI y gestión de API Keys para que los tenants integren EscalaFin con sus propios ERPs o sistemas contables.
- [ ] **Firma Electrónica Avanzada (Pagaré Digital NOM-151)**: Integración de firma biométrica/digital con validez jurídica NOM-151 para contratación 100% remota.

### 📱 Prioridad Media (Q4 2026)
- [ ] **Predictive AI Collections Route**: Motor de IA para optimización de rutas de visita en campo que sugiere la hora óptima para encontrar al cliente según su patrón histórico.
- [ ] **Programa de Lealtad & Gamificación**: Sistema de puntos, insignias y reducciones de tasa para acreditados con historial de pago puntual.
- [ ] **White-labeling Dinámico Avanzado**: Inyección de variables CSS y dominios personalizados (`financiera.com`) para cada tenant directamente desde el panel de administración.
- [ ] **Webhooks Salientes v1**: Sistema de eventos salientes (`loan.created`, `payment.received`, `client.blacklisted`) para integraciones con webhooks.

### 🌐 Prioridad Baja (2027)
- [ ] **Multi-tenancy Físico (Isolated DB per Tenant)**: Opción de aislamiento físico de base de datos PostgreSQL dedicada para clientes corporativos / Enterprise.
- [ ] **Aplicación Móvil Nativa iOS (App Store)**: Publicación oficial de la app compilada en la App Store de Apple.
- [ ] **Marketplace de Colaterales & Garantías**: Módulo para la gestión y subasta interna de bienes empeñados o en garantía.

---

## 🔧 6. Notas de Despliegue e Infraestructura (v3.0.0)

- **Versión de Producción**: `3.0.0`
- **Docker Build**: Debian 12 Bookworm Slim, Node.js 20.x, Next.js standalone output.
- **Base de Datos**: PostgreSQL 15 con migración Prisma `20260627202700_add_pld_modules`.
- **Canal de Soporte de la Plataforma**: WhatsApp directo `4424000742`.
- **Seguridad**: Cifrado TLS 1.3, firmas JWT tokenizadas en cookies HttpOnly y rate-limiting activo con Redis.
