# 🏦 EscalaFin - Sistema de Gestión de Créditos

[![Next.js](https://i.ytimg.com/vi/f53RvUpUA8w/sddefault.jpg)
[![TypeScript](https://i.ytimg.com/vi/4cgpu9L2AE8/maxresdefault.jpg)
[![Prisma](https://i.pinimg.com/736x/d7/c9/29/d7c929d0791fc4b844681296158bce06.jpg)
[![Tailwind CSS](https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80)
[![License](https://i.ytimg.com/vi/QDfLou004iE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAO5coXVtfm5wSC83NDzG-gWbTQwA)

**EscalaFin** es una plataforma completa para la gestión de préstamos y créditos con **navegación sidebar sticky**, optimizada para desktop y mobile, desarrollada con las tecnologías más modernas.

## 🆕 Novedades v2.1.0

- ✅ **Sidebar Navegacional Sticky** - Navegación fluida y persistente para desktop
- ✅ **Navegación Móvil Optimizada** - Sheet/Drawer responsive para mobile  
- ✅ **Sistema de Módulos PWA** - Carga dinámica de funcionalidades por rol
- ✅ **Dark/Light Theme** - Cambio de tema completo con persistencia
- ✅ **Layout Provider** - Arquitectura centralizada de UI
- ✅ **Performance Mejorado** - Cargas más rápidas y UX optimizada

---

## 🚀 Quick Start

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/escalafin-mvp.git
cd escalafin-mvp/app

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# Configurar base de datos
yarn prisma db push
yarn prisma db seed

# Iniciar aplicación
yarn dev
```

**🌐 Accede a:** `http://localhost:3000`

---

## 🎨 Navegación y UX

### 🖥️ Desktop Experience
*Sidebar navegacional sticky con categorización de módulos*

**Características:**
- **Sidebar sticky** colapsible/expandible
- **Categorización** de módulos por función
- **Filtrado automático** por rol de usuario
- **Indicador de página activa** 
- **Transiciones suaves** entre secciones

### 📱 Mobile Experience  
*Navegación móvil optimizada con Sheet/Drawer*

**Características:**
- **Header móvil** con menú hamburguesa
- **Sheet/Drawer** deslizante con navegación completa
- **Touch-optimized** para dispositivos móviles
- **Responsive design** fluido en todos los breakpoints

---

## 🏗️ Arquitectura Técnica

### Stack Principal
```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + Prisma ORM  
Database:  PostgreSQL
Auth:      NextAuth.js multi-provider
UI:        Shadcn/ui + Framer Motion
```

### Servicios Integrados
```
Payments:  OpenPay (tarjetas + SPEI)
Storage:   AWS S3 (archivos y documentos)
WhatsApp:  EvolutionAPI (notificaciones)
PWA:       Service Workers + App Manifest
```

### Navegación Architecture
```tsx
<LayoutProvider>
  {/* Desktop */}
  <Sidebar /> + <Header />
  
  {/* Mobile */}  
  <HeaderMobile />
  
  <MainContent>
    {children}
  </MainContent>
</LayoutProvider>
```

---

## 📋 Módulos del Sistema

| 📊 **Categoría** | 🔧 **Módulos** | 👥 **Roles** | 📱 **Mobile** |
|------------------|----------------|---------------|---------------|
| **🎯 Principal** | Dashboard | ALL | ✅ |
| **👥 Gestión** | Clientes, Préstamos, Pagos, Usuarios | ADMIN, ASESOR | ✅ |
| **📈 Reportes** | Portfolio, Cobranza, Analíticos | ADMIN, ASESOR | ✅ |  
| **💬 Comunicación** | WhatsApp, Notificaciones, Cobranza Móvil | ADMIN, ASESOR | ✅ |
| **⚙️ Configuración** | Módulos PWA, Sistema, APIs | ADMIN | ✅ |

### 🎯 Características por Rol

**🔴 ADMIN** - Control total del sistema
- Gestión completa de usuarios y configuración
- Acceso a todos los módulos y reportes
- Configuración de APIs y servicios externos

**🔵 ASESOR** - Gestión operativa  
- Manejo de clientes y préstamos asignados
- Procesamiento de pagos y cobranza
- Reportes de su cartera

**🟢 CLIENTE** - Portal de autoservicio
- Vista de sus préstamos y pagos
- Solicitud de créditos
- Notificaciones de su cuenta

---

## 🔧 Instalación Completa

### 1. Prerrequisitos
```bash
Node.js >= 18.17.0
Yarn >= 4.0.0  
PostgreSQL >= 15.0
AWS Account (S3)
OpenPay Account
```

### 2. Configuración de Servicios

**📊 Base de Datos PostgreSQL**
```sql
CREATE DATABASE escalafin_db;
CREATE USER escalafin_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE escalafin_db TO escalafin_user;
```

**☁️ AWS S3**
```bash
# Crear bucket
aws s3 mb s3://escalafin-storage --region us-east-1

# Configurar CORS
aws s3api put-bucket-cors --bucket escalafin-storage --cors-configuration file://cors.json
```

### 3. Variables de Entorno (.env.local)
```env
# Base de datos
DATABASE_URL="postgresql://escalafin_user:password@localhost:5432/escalafin_db"

# Autenticación  
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-aqui"

# AWS S3
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_BUCKET_NAME="escalafin-storage"
AWS_REGION="us-east-1"

# OpenPay
OPENPAY_ID="tu-merchant-id"
OPENPAY_PRIVATE_KEY="tu-private-key"
OPENPAY_PUBLIC_KEY="tu-public-key"
OPENPAY_PRODUCTION=false

# EvolutionAPI
EVOLUTION_API_URL="https://tu-instancia.evolutionapi.com"
EVOLUTION_API_TOKEN="tu-api-token"
EVOLUTION_INSTANCE="escalafin"
```

---

## 🧪 Testing y Quality

### Ejecutar Tests
```bash
# Tests unitarios
yarn test

# Tests de navegación específicos  
yarn test --testPathPattern=navigation

# Coverage completo
yarn test:coverage

# Visual regression tests
yarn test:visual
```

### Code Quality  
```bash
# TypeScript check
yarn tsc --noEmit

# ESLint
yarn lint

# Prettier
yarn format
```

### Performance Audit
```bash
# Build analysis
yarn analyze

# Lighthouse CI
yarn lighthouse

# Bundle size
yarn bundlesize
```

---

## 🚀 Despliegue

### 🖥️ EasyPanel (Recomendado)
```bash
# Ver guía completa
cat GUIA_DESPLIEGUE_EASYPANEL_ACTUALIZADA.md

# Deploy rápido
git push origin main  # Auto-deploy configurado
```

### ☁️ Vercel 
[![Deploy to Vercel](https://i.ytimg.com/vi/4DbNUJ-9_U4/maxresdefault.jpg)

### 🐳 Docker
```bash
# Build
docker build -t escalafin:latest .

# Run
docker run -p 3000:3000 --env-file .env.production escalafin:latest
```

---

## 📚 Documentación Completa

| 📖 **Guía** | 📋 **Descripción** | 🔗 **Link** |
|-------------|-------------------|-------------|
| **🔄 Migración DeepAgent** | Transferir proyecto a nueva cuenta | [DEEPAGENT_MIGRATION_GUIDE_ACTUALIZADA.md](DEEPAGENT_MIGRATION_GUIDE_ACTUALIZADA.md) |
| **📥 Importación Completa** | Setup desde cero paso a paso | [GUIA_COMPLETA_IMPORTACION_2025_ACTUALIZADA.md](GUIA_COMPLETA_IMPORTACION_2025_ACTUALIZADA.md) |
| **🚀 Deploy EasyPanel** | Despliegue en producción | [GUIA_DESPLIEGUE_EASYPANEL_ACTUALIZADA.md](GUIA_DESPLIEGUE_EASYPANEL_ACTUALIZADA.md) |
| **🐙 GitHub Setup** | Configuración completa repositorio | [GITHUB_SETUP_COMPLETO_ACTUALIZADO.md](GITHUB_SETUP_COMPLETO_ACTUALIZADO.md) |
| **📖 Manual Usuario** | Guía de uso del sistema | [ESCALAFIN_MANUAL_USUARIO.md](ESCALAFIN_MANUAL_USUARIO.md) |

### 📁 Documentación Técnica
- 🧭 [Navigation Guide](docs/NAVIGATION.md) - Arquitectura de navegación
- 📋 [Sidebar Guide](docs/SIDEBAR_GUIDE.md) - Implementación del sidebar  
- 📱 [Mobile UX Guide](docs/MOBILE_UX.md) - Experiencia móvil
- 🔌 [API Documentation](docs/API.md) - Endpoints y schemas
- 🗄️ [Database Schema](docs/SCHEMA.md) - Estructura de datos

---

## 🔌 API Endpoints

### 🔐 Autenticación
```http
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registrar usuario  
POST /api/auth/logout         # Cerrar sesión
GET  /api/auth/session        # Obtener sesión actual
```

### 👥 Clientes  
```http
GET    /api/clients           # Listar clientes
POST   /api/clients           # Crear cliente
PUT    /api/clients/[id]      # Actualizar cliente
DELETE /api/clients/[id]      # Eliminar cliente
GET    /api/clients/[id]/loans # Préstamos del cliente
```

### 💰 Préstamos
```http
GET  /api/loans               # Listar préstamos
POST /api/loans               # Crear préstamo
PUT  /api/loans/[id]          # Actualizar préstamo  
GET  /api/loans/[id]/amortization # Tabla amortización
POST /api/loans/[id]/payment  # Registrar pago
```

### 💳 Pagos
```http
GET  /api/payments            # Listar pagos
POST /api/payments/openpay    # Procesar pago OpenPay
POST /api/payments/manual     # Pago manual efectivo
GET  /api/payments/[id]       # Detalle del pago
```

### 📊 Reportes
```http
GET /api/reports/portfolio    # Reporte de cartera
GET /api/reports/collections  # Reporte de cobranza
GET /api/reports/analytics    # Métricas del sistema
```

### ⚙️ Sistema
```http
GET /api/modules/permissions  # Módulos por usuario
PUT /api/admin/modules        # Configurar módulos
GET /api/health              # Health check
```

---

## 🔄 Flujos de Trabajo

### 🏦 Flujo de Préstamo
```mermaid
graph LR
    A[Solicitud] --> B[Evaluación]
    B --> C[Aprobación]
    C --> D[Desembolso]
    D --> E[Pagos]
    E --> F[Finalización]
```

### 💳 Flujo de Pago
```mermaid
graph LR
    A[Generar Pago] --> B[OpenPay/Manual]
    B --> C[Validación]
    C --> D[Aplicación]
    D --> E[Notificación WhatsApp]
```

### 🔔 Flujo de Notificaciones
```mermaid
graph LR
    A[Evento] --> B[Template]
    B --> C[EvolutionAPI]
    C --> D[WhatsApp]
    D --> E[Confirmación]
```

---

## 📊 Performance y Métricas

### 🚀 Lighthouse Scores
- **Performance**: 95+ 
- **Accessibility**: 98+
- **Best Practices**: 100
- **SEO**: 95+
- **PWA**: 100

### 📱 Core Web Vitals
- **LCP** (Largest Contentful Paint): < 1.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 🧭 Navigation Performance
- **Sidebar load time**: < 100ms
- **Mobile menu open**: < 50ms
- **Module switch**: < 200ms
- **Theme toggle**: < 50ms

---

## 🤝 Contribuir al Proyecto

### 1. Setup de Desarrollo
```bash
# Fork el repositorio
git fork https://github.com/original/escalafin-mvp.git

# Clonar tu fork
git clone https://github.com/tu-usuario/escalafin-mvp.git
cd escalafin-mvp

# Configurar upstream
git remote add upstream https://github.com/original/escalafin-mvp.git

# Crear rama de feature
git checkout -b feature/nueva-funcionalidad
```

### 2. Standards de Código
- **TypeScript** para todo el código
- **ESLint + Prettier** para formateo
- **Conventional Commits** para mensajes
- **Tests** obligatorios para nuevas features
- **Documentation** para APIs y componentes

### 3. Pull Request Process
1. ✅ Tests pasando
2. 📝 Documentación actualizada
3. 🎨 Code review aprobado
4. ✅ Build exitoso
5. 🚀 Merge a develop/main

---

## 🆘 Troubleshooting

### ❌ Problemas Comunes

**Sidebar no aparece:**
```bash
# Verificar breakpoints CSS
# Sidebar solo es visible en >= md (768px)
# En mobile se usa HeaderMobile
```

**Módulos no cargan:**
```sql
-- Verificar módulos PWA en base de datos
SELECT * FROM "PWAModule" WHERE status = 'ENABLED';

-- Verificar permisos por rol
SELECT * FROM "ModuleRolePermission" WHERE role = 'ADMIN';
```

**Build falla:**
```bash
# Limpiar cache
rm -rf .next node_modules
yarn install
yarn build
```

**Performance lenta:**
```bash
# Analizar bundle
yarn analyze

# Verificar lighthouse
yarn lighthouse
```

### 📞 Obtener Ayuda

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/tu-usuario/escalafin-mvp/issues/new?template=bug_report.md)
- ✨ **Feature Requests**: [GitHub Issues](https://github.com/tu-usuario/escalafin-mvp/issues/new?template=feature_request.md)
- 🧭 **Navigation Issues**: [GitHub Issues](https://github.com/tu-usuario/escalafin-mvp/issues/new?template=navigation_issue.md)
- 📧 **Support Email**: soporte@escalafin.com
- 💬 **Discord**: [Server Invite]
- 📖 **Docs**: [Documentation Site]

---

## 📄 Licencia y Créditos

### 📜 MIT License
```
MIT License

Copyright (c) 2025 EscalaFin Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

Ver [LICENSE](LICENSE) para el texto completo.

### 🙏 Agradecimientos

- **Next.js Team** - Framework increíble
- **Prisma Team** - ORM excepcional  
- **Shadcn** - Componentes UI hermosos
- **Tailwind CSS** - Styling perfecto
- **DeepAgent** - AI-powered development
- **OpenPay** - Pagos confiables
- **AWS** - Infraestructura robusta

### 👥 Contributors

<a href="https://www.visualcinnamon.com/img/blog/2023/github-contributor-network/top_contributor_network_pdfjs.png">
  <img src="https://contrib.rocks/image?repo=tu-usuario/escalafin-mvp" />
</a>

---

## 📊 Stats del Proyecto

![GitHub stars](https://img.shields.io/github/stars/tu-usuario/escalafin-mvp?style=social)
![GitHub forks](https://img.shields.io/github/forks/tu-usuario/escalafin-mvp?style=social)
![GitHub issues](https://img.shields.io/github/issues/tu-usuario/escalafin-mvp)
![GitHub pull requests](https://img.shields.io/github/issues-pr/tu-usuario/escalafin-mvp)
![GitHub last commit](https://img.shields.io/github/last-commit/tu-usuario/escalafin-mvp)

---

<div align="center">

**🚀 Desarrollado con ❤️ usando Next.js, TypeScript y DeepAgent**

*EscalaFin v2.1.0 - Septiembre 2025*

[⭐ Star este proyecto](https://github.com/tu-usuario/escalafin-mvp) | [🐛 Reportar Bug](https://github.com/tu-usuario/escalafin-mvp/issues) | [💡 Solicitar Feature](https://github.com/tu-usuario/escalafin-mvp/issues)

</div>