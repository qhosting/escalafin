
# EscalaFin MVP - Sistema de Gestión de Préstamos y Créditos

## Descripción General

EscalaFin MVP es un sistema completo para la gestión de préstamos y créditos que incluye funcionalidades esenciales para administradores, asesores y clientes. La plataforma permite gestionar toda la cartera de préstamos desde el registro de clientes hasta el seguimiento de pagos.

## Características Principales

### 🔐 Sistema de Autenticación Multi-Rol
- Login/Registro con email y contraseña
- 3 tipos de usuario: **Admin**, **Asesor**, **Cliente**
- Redirección automática según rol del usuario
- Middleware de protección de rutas

### 📊 Dashboards Personalizados
- **Panel Admin**: Métricas generales, aprobación de solicitudes, gestión de usuarios
- **Panel Asesor**: Gestión de cartera, clientes asignados, solicitudes enviadas
- **Panel Cliente**: Préstamos activos, historial de pagos, tabla de amortización

### 💼 Módulo CRM
- Registro completo de clientes con información personal y financiera
- Asignación de clientes a asesores
- Estados de cliente (Activo, Inactivo, Lista Negra)

### 📋 Workflow de Solicitudes de Crédito
- Creación de solicitudes por asesores
- Revisión y aprobación/rechazo por admins
- Estados: Pendiente, En Revisión, Aprobado, Rechazado

### 💰 Gestión de Préstamos
- Generación automática de tablas de amortización
- Cálculo de pagos fijos con interés
- Seguimiento de saldos pendientes
- Estados de préstamo (Activo, Liquidado, Mora)

### 💳 Sistema de Pagos
- Registro manual de pagos
- Historial completo de pagos
- Múltiples métodos de pago
- Referencias y comprobantes

## Estructura Técnica

### Base de Datos (PostgreSQL + Prisma)
```
- users (Usuarios del sistema)
- clients (Información de clientes)
- credit_applications (Solicitudes de crédito)
- loans (Préstamos activos)
- amortization_schedule (Tabla de amortización)
- payments (Historial de pagos)
```

### Stack Tecnológico
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Autenticación**: NextAuth.js v4
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Deployment**: Ready para producción

## Cuentas de Prueba

### Administrador
- **Email**: admin@escalafin.com
- **Contraseña**: admin123
- **Funciones**: Aprobar solicitudes, gestionar usuarios, ver reportes

### Asesor
- **Email**: carlos.lopez@escalafin.com
- **Contraseña**: password123
- **Funciones**: Gestionar clientes, crear solicitudes, registrar pagos

### Cliente
- **Email**: juan.perez@email.com
- **Contraseña**: password123
- **Funciones**: Ver préstamos, historial de pagos, tabla de amortización

## Datos de Prueba Incluidos

El sistema incluye datos realistas de prueba:
- ✅ **7 usuarios** (1 Admin, 3 Asesores, 3 Clientes)
- ✅ **5 clientes** con información completa
- ✅ **3 solicitudes** de crédito en diferentes estados
- ✅ **3 préstamos** activos con pagos reales
- ✅ **60 registros** de tabla de amortización
- ✅ **7 pagos** procesados con referencias

## Características de Seguridad

- 🔒 Hasheo de contraseñas con bcrypt
- 🛡️ Middleware de protección de rutas
- 🔐 Validación de roles en APIs
- ✅ Sanitización de datos de entrada
- 🚫 Protección contra inyección SQL (Prisma ORM)

## Flujo de Trabajo

### Para Asesores:
1. Registrar nuevos clientes en CRM
2. Crear solicitudes de crédito con documentación
3. Enviar para revisión administrativa
4. Gestionar préstamos aprobados
5. Registrar pagos de clientes

### Para Administradores:
1. Revisar solicitudes pendientes
2. Aprobar/rechazar con comentarios
3. Supervisar cartera total
4. Gestionar usuarios del sistema
5. Generar reportes de rendimiento

### Para Clientes:
1. Acceder a portal personal
2. Ver préstamos activos y saldos
3. Consultar tabla de amortización
4. Revisar historial de pagos
5. Ver próximos vencimientos

## Métricas del MVP

### Funcionalidades Completadas:
- ✅ **Sistema de autenticación completo**
- ✅ **3 dashboards funcionales**
- ✅ **Módulo CRM básico**
- ✅ **Workflow de solicitudes**
- ✅ **Gestión de préstamos**
- ✅ **Sistema de pagos**
- ✅ **Portal del cliente**
- ✅ **Interfaz responsive**

### Base de Datos:
- **8 modelos** principales interconectados
- **12 enums** para estados y tipos
- **Relaciones** uno-a-muchos y muchos-a-muchos
- **Índices** optimizados para consultas

## Próximas Expansiones

### Fase 2 - Funcionalidades Avanzadas:
- 📈 Reportes y analytics avanzados
- 📧 Sistema de notificaciones
- 📱 Integración con APIs de pago
- 🔔 Alertas de mora automáticas
- 📊 Dashboard ejecutivo con charts

### Fase 3 - Integraciones:
- 🏦 Conexión con buró de crédito
- 💌 Envío de emails automático
- 📞 Sistema de cobranza
- 📋 Generación de contratos PDF
- 🔄 Integración con sistemas contables

## Comandos de Desarrollo

```bash
# Instalar dependencias
yarn install

# Ejecutar base de datos
yarn prisma db push
yarn prisma generate

# Sembrar datos de prueba
yarn prisma db seed

# Desarrollo
yarn dev

# Producción
yarn build
yarn start
```

## Notas de Desarrollo

- La aplicación usa **App Router** de Next.js 14
- Implementa **Server Actions** para operaciones de base de datos
- **Middleware** personalizado para protección de rutas
- **Componentes reutilizables** con Tailwind CSS
- **Tipos TypeScript** generados automáticamente por Prisma

---

**EscalaFin MVP** está listo para su implementación y puede expandirse fácilmente con funcionalidades adicionales según las necesidades del negocio.
