
# 🔄 Guía de Migración DeepAgent - EscalaFin 2025 (ACTUALIZADA)

## 📋 Información General

Esta guía actualizada te ayudará a migrar EscalaFin a una nueva cuenta DeepAgent con todas las características más recientes, incluyendo el **sidebar navegacional sticky** implementado.

### 🆕 Nuevas Características Incluidas
- ✅ **Sidebar Navegacional Sticky** responsive
- ✅ **Navegación Móvil** optimizada con Sheet/Drawer  
- ✅ **Sistema de Módulos PWA** mejorado
- ✅ **Dark/Light Theme** completo
- ✅ **Layout Provider** centralizado
- ✅ **Componentes UI** actualizados

---

## 🎯 Objetivos de la Migración

1. **Transferir** el proyecto completo a nueva cuenta DeepAgent
2. **Preservar** todas las funcionalidades existentes
3. **Implementar** mejoras de navegación
4. **Configurar** servicios y dependencias
5. **Validar** funcionamiento completo

---

## 📋 Pre-Migración: Checklist

### ✅ Preparación de Datos
- [ ] Backup completo de base de datos PostgreSQL
- [ ] Exportación de archivos S3 (si necesario)
- [ ] Documentación de variables de entorno
- [ ] Lista de usuarios y roles actuales
- [ ] Configuraciones de módulos PWA
- [ ] Credenciales de servicios externos

### ✅ Información Requerida
```
- URL de base de datos destino
- Credenciales AWS S3
- API Keys (OpenPay, EvolutionAPI)
- Dominio de producción (si aplica)
- Lista de usuarios administradores
```

---

## 🚀 Paso 1: Preparación del Entorno

### 1.1 Nueva Cuenta DeepAgent
```bash
# En la nueva cuenta DeepAgent
"Create a new Next.js project called escalafin-mvp"

# O importar desde GitHub
"Import project from GitHub: https://github.com/usuario/escalafin-mvp"
```

### 1.2 Verificación de Recursos
```bash
# Verificar versiones de Node/Yarn
node --version  # >= 18.17.0
yarn --version  # >= 4.0.0

# Verificar estructura del proyecto
ls -la escalafin-mvp/
```

---

## 📁 Paso 2: Transferencia de Código

### 2.1 Estructura de Archivos (Actualizada)
```
escalafin-mvp/
├── app/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx              # ✨ NUEVO
│   │   │   ├── header-mobile.tsx         # ✨ NUEVO  
│   │   │   ├── layout-provider.tsx       # ✨ NUEVO
│   │   │   └── header.tsx               # 🔄 ACTUALIZADO
│   │   ├── ui/
│   │   │   ├── sheet.tsx                # ✨ NUEVO
│   │   │   └── ...
│   │   └── dashboards/
│   ├── app/
│   │   ├── layout.tsx                   # 🔄 ACTUALIZADO
│   │   └── ...
│   ├── prisma/
│   ├── public/
│   └── ...
├── docs/                                # 📚 ACTUALIZADO
└── README.md                           # 📖 ACTUALIZADO
```

### 2.2 Componentes Críticos Nuevos
```tsx
// components/layout/sidebar.tsx - Navegación principal
// components/layout/header-mobile.tsx - Navegación móvil
// components/layout/layout-provider.tsx - Provider de layout
// components/ui/sheet.tsx - Componente Sheet para mobile
```

---

## 🗄️ Paso 3: Configuración de Base de Datos

### 3.1 Migración de Schema
```bash
# En la nueva instancia
cd escalafin-mvp/app

# Instalar dependencias
yarn install

# Configurar DATABASE_URL en .env
DATABASE_URL="postgresql://user:pass@host:5432/new_escalafin_db"

# Aplicar schema
yarn prisma generate
yarn prisma db push
```

### 3.2 Migración de Datos
```sql
-- Script de migración de datos principales
-- Usuarios
INSERT INTO "User" (id, name, email, password, role, createdAt, updatedAt)
SELECT id, name, email, password, role, "createdAt", "updatedAt"
FROM old_database."User";

-- Clientes  
INSERT INTO "Client" (...)
SELECT ... FROM old_database."Client";

-- Módulos PWA (incluye nuevas configuraciones)
INSERT INTO "PWAModule" (...)
SELECT ... FROM old_database."PWAModule";
```

### 3.3 Verificación de Datos
```bash
# Usar Prisma Studio para verificar
yarn prisma studio

# Verificar conteos
psql -c "SELECT COUNT(*) FROM \"User\";"
psql -c "SELECT COUNT(*) FROM \"Client\";"
psql -c "SELECT COUNT(*) FROM \"PWAModule\";"
```

---

## ⚙️ Paso 4: Configuración de Variables de Entorno

### 4.1 Variables Esenciales (.env.local)
```env
# Base de datos (Nueva instancia)
DATABASE_URL="postgresql://nuevo-usuario:password@nuevo-host:5432/escalafin_db"

# Autenticación
NEXTAUTH_URL="https://nueva-url.com"
NEXTAUTH_SECRET="nuevo-secret-super-seguro"

# AWS S3 (Migrar o mantener)
AWS_ACCESS_KEY_ID="access-key"
AWS_SECRET_ACCESS_KEY="secret-key"
AWS_BUCKET_NAME="nuevo-escalafin-bucket"
AWS_REGION="us-east-1"
AWS_FOLDER_PREFIX="uploads/"

# OpenPay (Mismas credenciales o nuevas)
OPENPAY_ID="merchant-id"
OPENPAY_PRIVATE_KEY="private-key"
OPENPAY_PUBLIC_KEY="public-key"
OPENPAY_PRODUCTION=false

# EvolutionAPI (Nueva instancia si es necesario)
EVOLUTION_API_URL="https://nueva-instancia.evolutionapi.com"
EVOLUTION_API_TOKEN="nuevo-token"
EVOLUTION_INSTANCE="escalafin_prod"

# Configuración específica nueva cuenta
NEXT_PUBLIC_APP_NAME="EscalaFin"
NEXT_PUBLIC_APP_VERSION="2.1.0"
NEXT_PUBLIC_ENVIRONMENT="production"
```

### 4.2 Inicialización de Servicios DeepAgent
```bash
# En DeepAgent, ejecutar comandos de inicialización:
"Initialize PostgreSQL database"
"Initialize authentication with signup params"  
"Initialize cloud storage for file uploads"
"Initialize LLM APIs"
```

---

## 🔧 Paso 5: Configuración de Servicios Externos

### 5.1 AWS S3 Setup
```bash
# Crear nuevo bucket (si es necesario)
aws s3 mb s3://nuevo-escalafin-bucket --region us-east-1

# Migrar archivos existentes
aws s3 sync s3://bucket-origen s3://nuevo-escalafin-bucket --region us-east-1

# Configurar CORS
aws s3api put-bucket-cors --bucket nuevo-escalafin-bucket --cors-configuration file://cors.json
```

### 5.2 OpenPay Migration
```bash
# Test nueva configuración
curl -X GET "https://sandbox-api.openpay.mx/v1/MERCHANT_ID" \
  -u "PRIVATE_KEY:" \
  -H "Content-type: application/json"
```

### 5.3 EvolutionAPI Setup
```bash
# Crear nueva instancia
curl -X POST "https://nueva-instancia.evolutionapi.com/instance/create" \
  -H "Authorization: Bearer nuevo-token" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "escalafin_prod"}'
```

---

## 🎨 Paso 6: Validación de Nueva Navegación

### 6.1 Sidebar Desktop
```bash
# Verificar que el sidebar funciona correctamente
"Test the sidebar navigation on desktop - should be collapsible and show all modules"
```

**Funcionalidades a validar:**
- [ ] ✅ Sidebar se colapsa/expande con botón
- [ ] ✅ Navegación por categorías funciona
- [ ] ✅ Indicador de página activa
- [ ] ✅ Módulos se filtran por rol de usuario
- [ ] ✅ Footer con info del usuario
- [ ] ✅ Responsive (se oculta en mobile)

### 6.2 Navegación Mobile
```bash
# Verificar navegación móvil
"Test mobile navigation - should show hamburger menu with sheet drawer"
```

**Funcionalidades a validar:**
- [ ] ✅ Header móvil se muestra solo en mobile
- [ ] ✅ Menú hamburguesa abre Sheet
- [ ] ✅ Navegación completa en drawer
- [ ] ✅ Info de usuario visible
- [ ] ✅ Botones de acción funcionan

### 6.3 Theme System
```bash
# Verificar sistema de temas
"Test dark/light mode toggle - should persist and apply correctly"
```

---

## 🧪 Paso 7: Testing Completo

### 7.1 Tests Funcionales
```bash
cd escalafin-mvp/app

# TypeScript
yarn tsc --noEmit

# Build test
yarn build

# Ejecutar aplicación
yarn start
```

### 7.2 Validación Manual
**URLs críticas a probar:**
```
https://nueva-url.com/auth/login
https://nueva-url.com/admin/dashboard
https://nueva-url.com/clients
https://nueva-url.com/loans  
https://nueva-url.com/payments
https://nueva-url.com/admin/modules
https://nueva-url.com/mobile/cobranza
```

### 7.3 Testing de Módulos PWA
```sql
-- Verificar módulos habilitados
SELECT "moduleKey", name, status, category 
FROM "PWAModule" 
WHERE status = 'ENABLED';

-- Verificar permisos por rol
SELECT m."moduleKey", m.name, rp.role, rp.enabled
FROM "PWAModule" m
JOIN "ModuleRolePermission" rp ON m.id = rp."moduleId"
ORDER BY rp.role, m.category;
```

---

## 🚀 Paso 8: Puesta en Producción

### 8.1 Build Final
```bash
# Build optimizado
NODE_ENV=production yarn build

# Verificar tamaño del bundle
yarn analyze
```

### 8.2 Configuración de Producción
```env
# .env.production
NODE_ENV=production
NEXTAUTH_URL=https://escalafin.tu-dominio.com
DATABASE_URL=postgresql://prod-user:pass@prod-host:5432/escalafin_prod
```

### 8.3 Health Checks
```bash
# Endpoints de verificación
curl https://escalafin.tu-dominio.com/api/health
curl https://escalafin.tu-dominio.com/api/modules/permissions
```

---

## 📊 Paso 9: Monitoreo Post-Migración

### 9.1 Métricas a Monitorear
```javascript
// Métricas críticas
const metricas = {
  tiempo_carga_sidebar: '< 200ms',
  tiempo_navegacion: '< 100ms', 
  errores_modulos: '< 1%',
  tiempo_autenticacion: '< 500ms',
  disponibilidad_s3: '99.9%'
};
```

### 9.2 Logs de Aplicación
```bash
# Monitorear logs
tail -f /var/log/escalafin/application.log
tail -f /var/log/escalafin/error.log
```

---

## 🔄 Paso 10: Rollback Plan

### 10.1 Plan de Contingencia
```bash
# En caso de problemas críticos
1. Mantener instancia anterior activa por 72h
2. Backup de nueva configuración
3. DNS rollback plan
4. Comunicación a usuarios
```

### 10.2 Backup Strategy
```sql
-- Backup de la nueva instancia
pg_dump escalafin_db > backup_post_migration.sql

-- Backup de configuraciones
cp .env.production .env.production.backup
```

---

## ✅ Checklist Final de Migración

### Funcionalidad Básica
- [ ] ✅ Aplicación inicia sin errores
- [ ] ✅ Base de datos conecta correctamente
- [ ] ✅ Autenticación funciona (login/logout)
- [ ] ✅ Todos los roles (ADMIN/ASESOR/CLIENTE) funcionan

### Nueva Navegación
- [ ] ✅ Sidebar desktop funciona correctamente
- [ ] ✅ Navegación móvil responsive
- [ ] ✅ Todas las categorías de módulos visibles
- [ ] ✅ Páginas activas se destacan
- [ ] ✅ Transiciones suaves funcionando

### Módulos PWA
- [ ] ✅ Módulos cargan dinámicamente
- [ ] ✅ Permisos por rol funcionan
- [ ] ✅ Configuraciones se mantienen
- [ ] ✅ Dashboard muestra módulos activos

### Servicios Externos
- [ ] ✅ AWS S3 uploads funcionan
- [ ] ✅ OpenPay procesa pagos correctamente
- [ ] ✅ WhatsApp notifications operativas
- [ ] ✅ Todas las integraciones activas

### Performance
- [ ] ✅ Tiempo de carga < 3 segundos
- [ ] ✅ Navegación fluida
- [ ] ✅ Sin errores en consola
- [ ] ✅ Responsive en todos los dispositivos

### Datos
- [ ] ✅ Todos los usuarios migrados
- [ ] ✅ Clientes y préstamos intactos  
- [ ] ✅ Historial de pagos completo
- [ ] ✅ Configuraciones preservadas

---

## 📞 Soporte Post-Migración

### Contactos de Emergencia
- 🚨 **Soporte Técnico**: soporte@escalafin.com
- 📧 **DevOps**: devops@escalafin.com  
- 💬 **Chat 24/7**: Canal #support
- 📱 **WhatsApp**: +1-800-ESCALA

### Recursos Adicionales
- 📖 **Documentación**: `/docs`
- 🎥 **Videos**: [YouTube Channel]
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: [Feature Board]

---

*Guía actualizada: Septiembre 2025*
*EscalaFin v2.1.0 - Includes Sidebar Navigation*
*Compatible con DeepAgent 2025*
