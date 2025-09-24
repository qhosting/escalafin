
# 📋 EscalaFin - Manual de Usuario Final

## 🏢 Sistema de Gestión Integral de Préstamos y Créditos

**Versión:** v3.0 - Producción
**Fecha:** Septiembre 2025
**Desarrollado para:** Gestión profesional de préstamos y créditos

---

## 📖 Índice

1. [Información General](#información-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Guía de Uso por Módulos](#guía-de-uso-por-módulos)
5. [Configuraciones](#configuraciones)
6. [Integraciones](#integraciones)
7. [Reportes y Analíticas](#reportes-y-analíticas)
8. [Solución de Problemas](#solución-de-problemas)
9. [Configuración Técnica](#configuración-técnica)

---

## 🔍 Información General

### Descripción del Sistema
**EscalaFin** es un sistema integral de gestión de préstamos y créditos diseñado para instituciones financieras, cooperativas y empresas de microfinanzas. Ofrece un flujo completo desde la solicitud hasta la cobranza, con integraciones avanzadas para pagos y notificaciones.

### Características Principales
- ✅ **Gestión Completa de Préstamos**
- ✅ **Portal Multi-Rol** (Admin, Asesor, Cliente)
- ✅ **Integración de Pagos** (Openpay + Efectivo)
- ✅ **Notificaciones WhatsApp** (EvolutionAPI)
- ✅ **Analíticas Avanzadas** y Dashboard Ejecutivo
- ✅ **Módulo de Cobro Móvil**
- ✅ **Sistema de Archivos** (AWS S3)
- ✅ **Exportación de Reportes** (PDF, Excel)
- ✅ **Auditoría y Logs** Completos
- ✅ **Modo Oscuro** y Personalización

### Tecnologías Utilizadas
- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de Datos:** PostgreSQL
- **Autenticación:** NextAuth.js
- **Pagos:** Openpay API
- **Notificaciones:** EvolutionAPI (WhatsApp)
- **Almacenamiento:** AWS S3
- **Hosting:** Plataforma Abacus.AI

---

## 🏗️ Arquitectura del Sistema

### Estructura de Base de Datos
```
Users (Usuarios del Sistema)
├── Clients (Información de Clientes)
├── Loans (Préstamos Activos)
├── LoanApplications (Solicitudes de Crédito)
├── Payments (Historial de Pagos)
├── Documents (Documentos y Archivos)
├── Notifications (Centro de Notificaciones)
├── AuditLogs (Logs de Auditoría)
└── SystemSettings (Configuraciones del Sistema)
```

### Flujo de Trabajo Principal
1. **Registro de Cliente** → **Evaluación Crediticia** → **Aprobación/Rechazo**
2. **Desembolso de Préstamo** → **Gestión de Pagos** → **Cobranza**
3. **Monitoreo** → **Reportes** → **Análisis de Rendimiento**

---

## 👥 Roles y Permisos

### 🔴 ADMINISTRADOR
**Acceso Completo al Sistema**
- Gestión de usuarios y roles
- Configuración del sistema
- Aprobación de préstamos grandes
- Acceso a todos los reportes
- Configuración de integraciones
- Auditoría y logs del sistema

### 🟡 ASESOR
**Gestión Operativa de Préstamos**
- Registro de nuevos clientes
- Evaluación de solicitudes de crédito
- Gestión de préstamos asignados
- Procesamiento de pagos
- Módulo de cobro móvil
- Reportes de su cartera

### 🟢 CLIENTE
**Portal de Autoservicio**
- Consulta de saldo y pagos
- Historial de transacciones
- Solicitud de nuevos préstamos
- Descarga de estados de cuenta
- Actualización de datos personales

---

## 📱 Guía de Uso por Módulos

### 1. 🔐 Acceso al Sistema

**URL de Acceso:** `https://tu-dominio.com/auth/login`

**Credenciales de Prueba:**
- **Admin:** admin@escalafin.com / admin123
- **Asesor:** asesor@escalafin.com / asesor123
- **Cliente:** cliente@escalafin.com / cliente123

### 2. 👨‍💼 Módulo de Administrador

#### Dashboard Principal
- **Métricas Clave:** Total de préstamos, cartera vigente, pagos recibidos
- **Gráficos:** Tendencias de préstamos, estado de pagos, análisis de riesgo
- **Alertas:** Pagos vencidos, solicitudes pendientes

#### Gestión de Usuarios
1. **Crear Usuario:** Admin → Usuarios → Nuevo Usuario
2. **Asignar Rol:** Seleccionar entre Admin/Asesor/Cliente
3. **Configurar Permisos:** Definir accesos específicos

#### Configuración del Sistema
- **Integraciones:** Openpay, WhatsApp, AWS S3
- **Parámetros:** Tasas de interés, plazos máximos
- **Notificaciones:** Templates y configuraciones

### 3. 🏦 Módulo de Asesor

#### Gestión de Clientes
1. **Registro de Cliente:**
   - Datos personales y contacto
   - Información laboral y financiera
   - Documentos requeridos (upload)

2. **Evaluación Crediticia:**
   - Score automático basado en algoritmos
   - Análisis manual de riesgo
   - Documentación de la decisión

#### Procesamiento de Préstamos
1. **Nueva Solicitud:**
   - Seleccionar cliente existente
   - Definir monto, plazo e interés
   - Adjuntar documentos

2. **Seguimiento:**
   - Estados: Pendiente → En Revisión → Aprobado/Rechazado
   - Historial de cambios y comentarios

#### Cobro Móvil
- **Ubicación GPS** del cobro
- **Registro de pago en efectivo**
- **Generación de recibo**
- **Notificación automática al cliente**

### 4. 👤 Portal del Cliente

#### Dashboard Personal
- Saldo actual y próximo pago
- Historial de transacciones
- Estado de solicitudes pendientes

#### Servicios Disponibles
1. **Realizar Pago:**
   - Pago con tarjeta (Openpay)
   - Consulta de referencias bancarias

2. **Nueva Solicitud:**
   - Formulario de solicitud simple
   - Upload de documentos
   - Seguimiento en tiempo real

3. **Documentos:**
   - Descarga de estados de cuenta
   - Contratos y pagarés
   - Historial de pagos

---

## ⚙️ Configuraciones

### Configuración de Pagos (Openpay)
1. **Acceso:** Admin → Configuración → Integraciones
2. **Datos Requeridos:**
   - Merchant ID
   - Private Key
   - Public Key (para frontend)
   - Configurar Webhook para confirmaciones

### Configuración WhatsApp (EvolutionAPI)
1. **Configuración de Instancia:**
   - URL de la API
   - Token de autorización
   - Número de teléfono principal

2. **Templates de Mensajes:**
   - Confirmación de pago
   - Recordatorio de pago
   - Mensajes de cobranza

### AWS S3 (Almacenamiento de Archivos)
- **Configuración automática** al inicializar
- **Estructura de carpetas:**
  - `/clients/{id}/documents/`
  - `/loans/{id}/contracts/`
  - `/payments/{id}/receipts/`

---

## 📊 Reportes y Analíticas

### Reportes Disponibles

#### 📈 Reporte de Cartera
- Préstamos activos por asesor
- Distribución por montos y plazos
- Estados de pago y morosidad

#### 💰 Reporte Financiero
- Ingresos por intereses
- Pagos recibidos por período
- Análisis de rentabilidad

#### 👥 Reporte de Clientes
- Nuevos clientes por período
- Análisis demográfico
- Historial crediticio

#### 🎯 Reporte de Cobranza
- Pagos vencidos
- Efectividad de cobranza
- Gestión de cartera vencida

### Exportación
- **Formatos:** PDF, Excel, CSV
- **Programación:** Reportes automáticos
- **Distribución:** Email automático

---

## 🔧 Solución de Problemas

### Problemas Comunes

#### Error de Login
1. **Verificar credenciales**
2. **Limpiar caché del navegador**
3. **Verificar conexión a internet**

#### Pagos No Procesados
1. **Verificar configuración Openpay**
2. **Revisar webhook de confirmación**
3. **Contactar soporte técnico**

#### Notificaciones WhatsApp No Enviadas
1. **Verificar conexión EvolutionAPI**
2. **Revisar templates de mensajes**
3. **Verificar número de teléfono**

#### Archivos No Se Cargan
1. **Verificar configuración AWS S3**
2. **Revisar tamaño de archivo (máximo 10MB)**
3. **Verificar formato de archivo permitido**

### Contacto de Soporte
- **Email:** soporte@escalafin.com
- **Teléfono:** +52 xxx xxx xxxx
- **Horario:** Lunes a Viernes 9:00 - 18:00

---

## 🛠️ Configuración Técnica

### Variables de Entorno Requeridas
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tu-dominio.com

# Openpay
OPENPAY_MERCHANT_ID=...
OPENPAY_PRIVATE_KEY=...
OPENPAY_PUBLIC_KEY=...

# AWS S3
AWS_BUCKET_NAME=...
AWS_FOLDER_PREFIX=...

# WhatsApp
EVOLUTION_API_URL=...
EVOLUTION_API_TOKEN=...
```

### Requisitos del Sistema
- **Node.js:** v18 o superior
- **PostgreSQL:** v14 o superior
- **Memoria RAM:** Mínimo 2GB
- **Almacenamiento:** Mínimo 10GB

### Respaldos y Seguridad
- **Respaldo de BD:** Diario automático
- **Respaldo de archivos:** Semanal
- **Encriptación:** SSL/TLS en todas las comunicaciones
- **Auditoría:** Log de todas las transacciones

---

## 🚀 Pasos para Producción

### 1. Configuración de Dominio
1. Adquirir dominio personalizado
2. Configurar DNS records
3. Certificado SSL automático

### 2. Variables de Producción
- Cambiar `NODE_ENV=production`
- Configurar URLs de producción
- Actualizar credenciales de APIs

### 3. Monitoreo
- Configurar alertas de sistema
- Monitoreo de performance
- Logs de error automáticos

---

## 📞 Información de Contacto

**Desarrollado por:** Equipo DeepAgent - Abacus.AI
**Versión del Sistema:** v3.0 Final
**Fecha de Entrega:** Septiembre 2025

Para soporte técnico o consultas sobre funcionalidades adicionales, contacta al equipo de desarrollo a través de la plataforma.

---

**© 2025 EscalaFin - Sistema de Gestión Integral de Préstamos y Créditos**
