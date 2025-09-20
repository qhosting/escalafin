
# 🏦 EscalaFin - Sistema de Gestión Integral de Préstamos y Créditos

[![Next.js](https://i.ytimg.com/vi/f53RvUpUA8w/sddefault.jpg)
[![TypeScript](https://i.ytimg.com/vi/4cgpu9L2AE8/maxresdefault.jpg)
[![PostgreSQL](https://i.ytimg.com/vi/XdCV1WxG1Ug/hqdefault.jpg)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

Sistema completo de gestión de préstamos y créditos con funcionalidades avanzadas para instituciones financieras, cooperativas y empresas de microfinanzas.

## 🚀 Características Principales

- ✅ **Gestión Multi-Rol**: Admin, Asesor, Cliente
- ✅ **Sistema de Préstamos Completo**: Solicitudes, aprobaciones, amortización
- ✅ **Integración de Pagos**: Openpay API + Pagos en efectivo
- ✅ **Notificaciones WhatsApp**: EvolutionAPI integrada
- ✅ **Cobro Móvil**: GPS, recibos digitales
- ✅ **Analytics Avanzados**: Dashboard ejecutivo con métricas
- ✅ **Gestión de Archivos**: AWS S3 integrado
- ✅ **Auditoría Completa**: Logs y trazabilidad
- ✅ **Responsive Design**: Modo oscuro incluido

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **UI**: TailwindCSS + Radix UI + Shadcn/ui
- **Pagos**: Openpay API
- **Notificaciones**: EvolutionAPI (WhatsApp)
- **Almacenamiento**: AWS S3
- **Estado**: Zustand + SWR

### Estructura del Proyecto
```
escalafin_mvp/
├── app/                          # Aplicación Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── clients/              # Gestión de clientes
│   │   ├── loans/                # Gestión de préstamos
│   │   ├── payments/             # Procesamiento de pagos
│   │   ├── analytics/            # Métricas y reportes
│   │   └── webhooks/             # Webhooks externos
│   ├── admin/                    # Portal Administrador
│   ├── asesor/                   # Portal Asesor
│   ├── cliente/                  # Portal Cliente
│   ├── mobile/                   # Módulo cobro móvil
│   ├── components/               # Componentes React
│   ├── lib/                      # Utilidades y configuraciones
│   ├── prisma/                   # Esquema de base de datos
│   └── public/                   # Archivos estáticos
├── docs/                         # Documentación
└── README.md                     # Este archivo
```

## 📦 Instalación y Configuración

### Pre-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- Yarn (recomendado)
- Cuenta AWS (para S3)
- Cuenta Openpay (para pagos)
- EvolutionAPI (para WhatsApp)

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd escalafin_mvp/app
```

### 2. Instalar Dependencias
```bash
yarn install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@host:5432/database_name"

# Autenticación
NEXTAUTH_SECRET="tu_secreto_super_seguro_aqui"
NEXTAUTH_URL="http://localhost:3000"

# Ambiente
NODE_ENV="development"
NEXTAUTH_DEBUG=false

# Openpay (Pagos)
OPENPAY_MERCHANT_ID="tu_merchant_id"
OPENPAY_PRIVATE_KEY="tu_private_key"
OPENPAY_PUBLIC_KEY="tu_public_key"
OPENPAY_BASE_URL="https://sandbox-api.openpay.mx/v1"  # Sandbox
# OPENPAY_BASE_URL="https://api.openpay.mx/v1"        # Producción

# AWS S3 (Archivos)
AWS_ACCESS_KEY_ID="tu_access_key"
AWS_SECRET_ACCESS_KEY="tu_secret_key"
AWS_BUCKET_NAME="tu_bucket_name"
AWS_REGION="us-east-1"
AWS_FOLDER_PREFIX="escalafin/"

# WhatsApp (EvolutionAPI)
EVOLUTION_API_URL="https://tu-evolution-api.com"
EVOLUTION_API_TOKEN="tu_token_evolution"
EVOLUTION_INSTANCE_NAME="escalafin"

# URLs de Producción (cuando deploys)
# NEXTAUTH_URL="https://tu-dominio.com"
```

### 4. Configurar Base de Datos
```bash
# Generar cliente Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma db push

# Poblar con datos de prueba
yarn prisma db seed
```

### 5. Ejecutar en Desarrollo
```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👥 Usuarios de Prueba

### Credenciales de Acceso
```
Admin:
- Email: admin@escalafin.com
- Password: admin123

Asesor:
- Email: asesor@escalafin.com  
- Password: asesor123

Cliente:
- Email: cliente@escalafin.com
- Password: cliente123
```

## 🚀 Despliegue en Producción

### Variables de Entorno para Producción
```env
NODE_ENV="production"
NEXTAUTH_URL="https://tu-dominio.com"
DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"
# ... resto de variables con valores de producción
```

### Despliegue con Easypanel

#### 1. Preparar el Proyecto
```bash
# Build de producción
yarn build

# Test del build
yarn start
```

#### 2. Configurar Easypanel

**Dockerfile** (crear en la raíz si no existe):
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
```

**docker-compose.yml** para desarrollo local:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
  
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: escalafin
      POSTGRES_USER: escalafin_user
      POSTGRES_PASSWORD: escalafin_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### 3. Configuración en Easypanel
1. Crear nueva aplicación
2. Conectar repositorio GitHub
3. Configurar variables de entorno
4. Configurar base de datos PostgreSQL
5. Configurar dominio personalizado
6. Activar SSL automático

### Comandos de Build
```bash
# Instalación
yarn install

# Build
yarn build

# Inicio
yarn start
```

## 🔧 Scripts Disponibles

```bash
yarn dev          # Desarrollo con hot-reload
yarn build        # Build de producción
yarn start        # Iniciar producción
yarn lint         # Linting con ESLint
yarn prisma:generate   # Generar cliente Prisma
yarn prisma:migrate    # Ejecutar migraciones
yarn prisma:seed       # Poblar datos de prueba
yarn prisma:studio     # Abrir Prisma Studio
```

## 🗃️ Base de Datos

### Esquema Principal
- **Users**: Usuarios del sistema (Admin, Asesor, Cliente)
- **Clients**: Información detallada de clientes
- **Loans**: Préstamos activos y completados
- **LoanApplications**: Solicitudes de crédito
- **Payments**: Historial de pagos
- **Documents**: Documentos y archivos
- **Notifications**: Centro de notificaciones
- **AuditLogs**: Auditoría del sistema
- **SystemSettings**: Configuraciones globales

### Migraciones
Las migraciones se ejecutan automáticamente con:
```bash
yarn prisma db push
```

## 🔌 Integraciones

### Openpay (Pagos)
- Configurar merchant ID y keys
- Configurar webhook: `/api/webhooks/openpay`
- Soporta tarjetas de débito/crédito
- Manejo de 3D Secure

### EvolutionAPI (WhatsApp)
- Configurar instancia y token
- Webhook: `/api/webhooks/evolution-api`
- Templates personalizables
- Confirmaciones automáticas

### AWS S3 (Archivos)
- Configurar bucket y credenciales
- Estructura: `/clients/{id}/documents/`
- URLs firmadas para seguridad

## 📊 Funcionalidades por Rol

### 🔴 Administrador
- Dashboard ejecutivo con KPIs
- Gestión de usuarios y roles
- Configuración del sistema
- Reportes avanzados y exportación
- Auditoría completa
- Configuración de integraciones

### 🟡 Asesor
- Gestión de clientes asignados
- Procesamiento de préstamos
- Módulo de cobro móvil
- Reportes de cartera
- Evaluación crediticia

### 🟢 Cliente
- Consulta de saldos y pagos
- Solicitud de nuevos préstamos
- Descarga de documentos
- Actualización de datos
- Historial completo

## 🔒 Seguridad

- Autenticación JWT con NextAuth
- Roles y permisos granulares
- Encriptación de datos sensibles
- Logs de auditoría completos
- Rate limiting implementado
- HTTPS obligatorio en producción

## 📱 Características Móviles

- Diseño 100% responsive
- PWA capabilities
- Módulo de cobro móvil optimizado
- GPS para ubicación de cobros
- Recibos digitales

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
yarn test

# Coverage
yarn test:coverage
```

## 📈 Monitoreo y Logs

- Logs estructurados con Next.js
- Métricas de performance
- Alertas de error automáticas
- Dashboard de monitoreo interno

## 🤝 Contribución

### Para Desarrolladores
1. Fork del proyecto
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- TypeScript estricto
- ESLint + Prettier configurados
- Conventional Commits
- Documentación de APIs

## 📞 Soporte

Para soporte técnico o reportar bugs:
- Crear issue en GitHub
- Email: soporte@escalafin.com
- Documentación: `/docs`

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.

## 🏆 Estado del Proyecto

**✅ PRODUCCIÓN READY**
- Todas las funcionalidades implementadas
- Base de datos optimizada
- Integraciones funcionando
- Documentación completa
- Build exitoso sin errores
- Listo para despliegue

---

**© 2025 EscalaFin - Desarrollado con ❤️ usando Next.js**
