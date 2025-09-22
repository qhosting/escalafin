
# 🏢 EscalaFin - Sistema de Gestión de Créditos y Préstamos

> **Plataforma integral PWA para la gestión completa de préstamos, clientes y cobranza con navegación optimizada y diseño responsive**

[![Next.js](https://i.ytimg.com/vi/4cgpu9L2AE8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCzedb-c7IZSg8ZCib1APCJvLdWqw)
[![TypeScript](https://i.ytimg.com/vi/4cgpu9L2AE8/maxresdefault.jpg)
[![Tailwind CSS](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/2560px-Tailwind_CSS_Logo.svg.png)
[![PostgreSQL](https://i.ytimg.com/vi/uUalQbg-TGA/maxresdefault.jpg)
[![Prisma](https://www.shutterstock.com/shutterstock/photos/1754412563/display_1500/stock-photo--d-rendering-of-a-police-badge-on-a-dark-background-1754412563.jpg)
[![AWS S3](https://i.ytimg.com/vi/yRkueY7Q2U8/maxresdefault.jpg)

## 🆕 **Últimas Actualizaciones**

### 🎨 **Nueva Navegación Optimizada**
- ✅ **Sidebar fijo responsive** con control de scroll inteligente
- ✅ **Página landing profesional** para usuarios no autenticados  
- ✅ **Login simplificado** con mejor UX
- ✅ **Eliminada duplicación de menús** - Layout reorganizado completamente
- ✅ **Transiciones suaves** y animaciones CSS

---

## 🚀 **Características Principales**

### 💼 **Gestión Integral**
- **Multi-Rol**: Administradores, Asesores y Clientes
- **Dashboard Inteligente**: KPIs, gráficos y métricas en tiempo real
- **Gestión de Clientes**: Perfiles completos con historial crediticio
- **Portfolio de Préstamos**: Tracking completo del ciclo de vida
- **Sistema de Pagos**: Openpay + pagos manuales con reconciliación

### 🔧 **Tecnología Avanzada**
- **PWA Completa**: Instalable, offline-ready, push notifications
- **Cloud Storage**: AWS S3 para manejo seguro de documentos
- **WhatsApp Integration**: Notificaciones automáticas via EvolutionAPI
- **Real-time Updates**: Sincronización automática de datos
- **Dark/Light Mode**: Soporte completo de temas

### 📱 **Experiencia de Usuario**
- **Sidebar Fijo Inteligente**: Aparece/desaparece con scroll
- **100% Responsive**: Mobile-first design approach
- **Navegación Categorizada**: Módulos organizados por grupos lógicos
- **Theme Toggle**: Cambio de tema desde el sidebar
- **Landing Page**: Página de inicio profesional para visitantes

---

## 📋 **Módulos del Sistema**

<details>
<summary><strong>👥 Gestión de Clientes</strong></summary>

- ✅ CRUD completo de clientes
- ✅ Perfiles detallados con scoring crediticio
- ✅ Historial de préstamos y pagos
- ✅ Sistema de archivos adjuntos
- ✅ Filtros y búsqueda avanzada
</details>

<details>
<summary><strong>💳 Sistema de Préstamos</strong></summary>

- ✅ Creación y gestión de préstamos
- ✅ Tablas de amortización dinámicas  
- ✅ Diferentes tipos de interés y modalidades
- ✅ Workflow de aprobación
- ✅ Estados y tracking completo
</details>

<details>
<summary><strong>💰 Gestión de Pagos</strong></summary>

- ✅ **Openpay Integration**: Pagos en línea seguros
- ✅ **Pagos Manuales**: Para transacciones en efectivo
- ✅ Reconciliación automática
- ✅ Estados de pago en tiempo real
- ✅ Historial y reportes detallados
</details>

<details>
<summary><strong>📊 Reportes y Analytics</strong></summary>

- ✅ Dashboard ejecutivo con KPIs
- ✅ Reporte de portfolio
- ✅ Analytics de cobranza
- ✅ Métricas de performance
- ✅ Exportación a Excel/PDF
</details>

<details>
<summary><strong>📱 Notificaciones WhatsApp</strong></summary>

- ✅ **EvolutionAPI Integration**
- ✅ Notificaciones automáticas de pagos
- ✅ Recordatorios de vencimiento
- ✅ Estados de entrega tracking
- ✅ Templates personalizables
</details>

<details>
<summary><strong>🔐 Sistema de Usuarios</strong></summary>

- ✅ **NextAuth.js** con múltiples roles
- ✅ **Roles**: ADMIN, ASESOR, CLIENTE
- ✅ Permisos granulares por módulo
- ✅ Sistema de sesiones seguro
- ✅ Gestión de perfiles
</details>

---

## 🏗️ **Arquitectura Técnica**

### **Frontend**
```
Next.js 14 (App Router) + TypeScript
├── 🎨 Tailwind CSS + Shadcn/ui
├── 📱 PWA completa con service workers  
├── 🌙 Dark/Light mode con next-themes
├── 📊 Charts con Recharts + Chart.js
└── 🔄 Real-time updates con SWR
```

### **Backend** 
```
Next.js API Routes + Middleware
├── 🔐 NextAuth.js para autenticación
├── 🗄️ Prisma ORM + PostgreSQL
├── ☁️ AWS S3 para cloud storage
├── 📱 EvolutionAPI para WhatsApp
└── 💳 Openpay para pagos online
```

### **Base de Datos**
```sql
PostgreSQL con Prisma Schema
├── 👤 Users (multi-role con permisos)
├── 👥 Clients (perfiles y scoring) 
├── 💳 Loans (préstamos y amortización)
├── 💰 Payments (pagos y transacciones)
├── 📄 Files (documentos en S3)
├── 📊 Analytics (métricas y KPIs)
└── ⚙️ SystemConfig (configuración)
```

---

## 🚀 **Guías de Instalación**

### **🔧 Setup Local**
```bash
# 1. Clonar el repositorio
git clone [tu-repo-url]
cd escalafin_mvp

# 2. Instalar dependencias
cd app && yarn install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Setup base de datos
npx prisma migrate dev
npx prisma db seed

# 5. Ejecutar en desarrollo  
yarn dev
```

### **🐳 Deploy con Docker**
```bash
# Build de la imagen
docker build -t escalafin .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env escalafin
```

### **☁️ Deploy en EasyPanel**
Ver guía completa: [`GUIA_DESPLIEGUE_EASYPANEL.md`](./GUIA_DESPLIEGUE_EASYPANEL.md)

---

## 📚 **Documentación Completa**

### **🎯 Guías de Usuario**
- 📖 [`ESCALAFIN_MANUAL_USUARIO.md`](./ESCALAFIN_MANUAL_USUARIO.md) - Manual completo de usuario
- 🚀 [`QUICK_START.md`](./QUICK_START.md) - Inicio rápido
- 🔐 [`GUIA_LOGIN_Y_USO.md`](./GUIA_LOGIN_Y_USO.md) - Login y primeros pasos

### **🛠️ Guías Técnicas**
- 🏗️ [`ESTRUCTURA_PROYECTO.md`](./ESTRUCTURA_PROYECTO.md) - Arquitectura del código
- 🗄️ [`SCHEMA.md`](./SCHEMA.md) - Esquema de base de datos  
- 🔒 [`SECURITY.md`](./SECURITY.md) - Políticas de seguridad
- 📁 [`DOCUMENTACION_SISTEMA_ALMACENAMIENTO.md`](./DOCUMENTACION_SISTEMA_ALMACENAMIENTO.md) - Sistema de archivos

### **☁️ Guías de Deployment**
- 🚀 [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Deploy general
- 🎛️ [`GUIA_DESPLIEGUE_EASYPANEL.md`](./GUIA_DESPLIEGUE_EASYPANEL.md) - EasyPanel específico
- 📱 [`PWA_IMPLEMENTATION_GUIDE.md`](./PWA_IMPLEMENTATION_GUIDE.md) - Configuración PWA

### **🔄 Migración y Continuidad**
- 🔄 [`DEEPAGENT_MIGRATION_GUIDE.md`](./DEEPAGENT_MIGRATION_GUIDE.md) - Migración entre cuentas
- 📥 [`GUIA_COMPLETA_IMPORTACION_2025.md`](./GUIA_COMPLETA_IMPORTACION_2025.md) - Importación completa
- 🐙 [`GITHUB_SETUP_COMPLETO.md`](./GITHUB_SETUP_COMPLETO.md) - Setup de GitHub

---

## 🎮 **Testing de la Aplicación**

### **🧪 Cuentas de Prueba**
```
👨‍💼 ADMIN
Email: admin@escalafin.com
Password: admin123

👨‍💻 ASESOR  
Email: carlos.lopez@escalafin.com
Password: password123

👤 CLIENTE
Email: juan.perez@email.com
Password: password123
```

### **✅ Funcionalidades a Probar**
1. **🏠 Landing Page** - Navegación no autenticada
2. **🔐 Login/Logout** - Autenticación y roles
3. **🏗️ Sidebar Responsive** - Colapso y scroll behavior
4. **👥 Gestión de Clientes** - CRUD completo
5. **💳 Creación de Préstamos** - Workflow completo
6. **💰 Registro de Pagos** - Manual y Openpay
7. **📊 Dashboards** - Visualización de datos
8. **📱 PWA Features** - Instalación y offline mode

---

## ⚙️ **Configuración de Servicios**

### **🔐 Variables de Entorno Requeridas**
```env
# Base de datos
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Autenticación  
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key"

# AWS S3
AWS_BUCKET_NAME="tu-bucket"
AWS_FOLDER_PREFIX="escalafin/"

# Openpay
OPENPAY_API_KEY="tu-api-key"
OPENPAY_BASE_URL="https://sandbox-api.openpay.mx"
# ... más variables según necesidades
```

### **📱 Servicios Externos**
- **💳 Openpay**: Pagos en línea (configuración en panel admin)
- **📱 EvolutionAPI**: WhatsApp notifications
- **☁️ AWS S3**: Cloud storage para archivos
- **📧 Email Service**: Para notificaciones (opcional)

---

## 🛡️ **Seguridad y Compliance**

- ✅ **Autenticación segura** con NextAuth.js
- ✅ **Roles y permisos** granulares
- ✅ **Encriptación** de datos sensibles
- ✅ **Headers de seguridad** configurados
- ✅ **Rate limiting** en APIs críticas
- ✅ **Validación** en cliente y servidor
- ✅ **Logs de auditoría** para acciones críticas

---

## 📈 **Performance y Escalabilidad**

### **⚡ Optimizaciones Implementadas**
- **Static Generation** para páginas públicas
- **Dynamic Imports** para code splitting
- **Image Optimization** con Next.js Image
- **CSS-in-JS** optimizado con Tailwind
- **Database Indexing** en campos críticos
- **Caching** estratégico en APIs

### **📊 Métricas Objetivo**
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 3s  
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

---

## 🤝 **Contribución y Soporte**

### **📝 Reportar Issues**
1. Usa el sistema de issues de GitHub
2. Proporciona pasos para reproducir
3. Incluye logs y screenshots
4. Especifica el navegador/dispositivo

### **🚀 Proponer Features**
1. Abre un discussion de GitHub
2. Describe el caso de uso
3. Proporciona mockups si es posible
4. Considera el impacto en performance

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver [`LICENSE`](./LICENSE) para más detalles.

---

## 📞 **Contacto y Soporte**

- **📧 Email**: soporte@escalafin.com
- **💬 Discord**: [Servidor de EscalaFin]
- **📚 Docs**: [Documentación completa]
- **🐛 Issues**: [GitHub Issues]

---

<div align="center">

### 🌟 **¿Te gusta EscalaFin?**

**⭐ Dale una estrella al proyecto** • **🍴 Fork para contribuir** • **📢 Comparte con tu equipo**

---

**Desarrollado con ❤️ para instituciones financieras modernas**

*EscalaFin © 2025 - Sistema de Gestión de Créditos y Préstamos*

</div>
