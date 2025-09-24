
# 🐙 GitHub Setup Completo - EscalaFin 2025 (ACTUALIZADO)

## 📋 Información del Repositorio

Esta guía actualizada incluye la configuración completa de GitHub para EscalaFin con todas las características más recientes, incluyendo el **sidebar navegacional sticky** y las mejoras de UI implementadas.

### 🆕 Actualizaciones Incluidas
- ✅ **Sidebar Navegacional** - Documentación y screenshots
- ✅ **Navegación Móvil** - Responsive design docs  
- ✅ **Sistema de Módulos PWA** - Nueva arquitectura
- ✅ **Layout Provider** - Documentación técnica
- ✅ **CI/CD Actualizado** - Deploy con nuevas features
- ✅ **Testing Coverage** - Incluye tests de navegación

---

## 🎯 Objetivos del Setup

1. **Crear** repositorio GitHub optimizado
2. **Configurar** CI/CD con GitHub Actions
3. **Documentar** las nuevas características
4. **Implementar** branch protection y workflows
5. **Configurar** integración con DeepAgent y EasyPanel

---

## 📁 Estructura del Repositorio (Actualizada)

```
escalafin-mvp/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # ✨ ACTUALIZADO
│   │   ├── deploy.yml                # ✨ ACTUALIZADO  
│   │   ├── test-navigation.yml       # ✨ NUEVO
│   │   └── security.yml              # 🔒 ACTUALIZADO
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md            # 🐛 ACTUALIZADO
│   │   ├── feature_request.md       # ✨ NUEVO
│   │   └── navigation_issue.md      # 🧭 NUEVO
│   ├── PULL_REQUEST_TEMPLATE.md     # 📝 ACTUALIZADO
│   └── CODEOWNERS                   # 👥 ACTUALIZADO
├── app/                             # 💻 Aplicación principal
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx          # ✨ NUEVO
│   │   │   ├── header-mobile.tsx    # 📱 NUEVO
│   │   │   └── layout-provider.tsx  # 🏗️ NUEVO
│   │   └── ...
│   └── ...
├── docs/                            # 📚 ACTUALIZADA
│   ├── NAVIGATION.md                # 🧭 NUEVO
│   ├── SIDEBAR_GUIDE.md             # 📋 NUEVO
│   ├── MOBILE_UX.md                 # 📱 NUEVO
│   └── ...
├── screenshots/                     # 📸 ACTUALIZADA
│   ├── sidebar-desktop.png          # ✨ NUEVO
│   ├── mobile-navigation.png        # 📱 NUEVO
│   └── ...
├── README.md                        # 📖 ACTUALIZADO
├── CHANGELOG.md                     # 📝 ACTUALIZADO
├── CONTRIBUTING.md                  # 👥 ACTUALIZADO
└── ...
```

---

## 🚀 Paso 1: Inicialización del Repositorio

### 1.1 Crear Repositorio
```bash
# Crear repositorio en GitHub
Repository name: escalafin-mvp
Description: "Sistema completo de gestión de préstamos con sidebar navegacional sticky - Next.js 14, PostgreSQL, AWS S3, OpenPay"
Visibility: Private (o Public según necesidad)
Initialize with: README, .gitignore (Node.js), License (MIT)
```

### 1.2 Clone Local
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/escalafin-mvp.git
cd escalafin-mvp

# Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu.email@gmail.com"
```

### 1.3 Estructura Inicial
```bash
# Crear estructura de directorios
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE
mkdir -p docs
mkdir -p screenshots
mkdir -p tests
```

---

## 📝 Paso 2: Documentación Principal

### 2.1 README.md Actualizado
```markdown
# 🏦 EscalaFin - Sistema de Gestión de Créditos

[![Next.js](https://i.ytimg.com/vi/f53RvUpUA8w/sddefault.jpg)
[![TypeScript](https://i.ytimg.com/vi/4cgpu9L2AE8/maxresdefault.jpg)
[![Prisma](https://i.pinimg.com/736x/d7/c9/29/d7c929d0791fc4b844681296158bce06.jpg)
[![Tailwind CSS](https://i.ytimg.com/vi/cY0XJY98d3w/maxresdefault.jpg)

**EscalaFin** es una plataforma completa para la gestión de préstamos y créditos con navegación sidebar sticky, optimizada para desktop y mobile.

## 🆕 Nuevas Características v2.1.0

- ✅ **Sidebar Navegacional Sticky** - Navegación fluida y persistente
- ✅ **Navegación Móvil** - Sheet/Drawer responsive para mobile
- ✅ **Sistema de Módulos PWA** - Carga dinámica de funcionalidades
- ✅ **Dark/Light Theme** - Cambio de tema completo
- ✅ **Layout Provider** - Arquitectura centralizada de UI

## 📸 Screenshots

### Desktop con Sidebar
![Sidebar Desktop](screenshots/sidebar-desktop.png)

### Navegación Móvil
![Mobile Navigation](screenshots/mobile-navigation.png)

## 🚀 Quick Start

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/escalafin-mvp.git
cd escalafin-mvp/app

# Instalar dependencias
yarn install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar migraciones
yarn prisma db push

# Iniciar aplicación
yarn dev
```

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **Pagos**: OpenPay
- **Almacenamiento**: AWS S3
- **WhatsApp**: EvolutionAPI
- **UI Components**: Shadcn/ui

### Navegación
- **Desktop**: Sidebar sticky colapsible con categorías
- **Mobile**: Header con menú hamburguesa + Sheet drawer
- **PWA**: Módulos dinámicos según rol de usuario

## 📋 Módulos Disponibles

| Categoría | Módulos |
|-----------|---------|
| **Gestión** | Clientes, Préstamos, Pagos, Usuarios |
| **Reportes** | Portfolio, Cobranza, Analíticos |
| **Comunicación** | WhatsApp, Notificaciones, Cobranza Móvil |
| **Configuración** | Módulos PWA, Sistema, API Externa |

## 🔧 Instalación Completa

Ver [Guía de Instalación](GUIA_COMPLETA_IMPORTACION_2025_ACTUALIZADA.md)

## 🚀 Despliegue

- **EasyPanel**: [Guía EasyPanel](GUIA_DESPLIEGUE_EASYPANEL_ACTUALIZADA.md)
- **Vercel**: [Deploy to Vercel](https://vercel.com/new/git/external?repository-url=https://github.com/tu-usuario/escalafin-mvp)
- **Docker**: Ver `Dockerfile` en el proyecto

## 🧪 Testing

```bash
# Tests unitarios
yarn test

# Tests de integración
yarn test:integration

# Tests de navegación
yarn test:navigation

# Coverage
yarn test:coverage
```

## 📚 Documentación

- [Guía de Navegación](docs/NAVIGATION.md)
- [Sidebar Guide](docs/SIDEBAR_GUIDE.md) 
- [Mobile UX](docs/MOBILE_UX.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/SCHEMA.md)

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT License - ver [LICENSE](LICENSE)

## 📞 Soporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/tu-usuario/escalafin-mvp/issues)
- 📧 **Email**: soporte@escalafin.com
- 💬 **Discord**: [Servidor de Discord]

---

**Desarrollado con ❤️ usando Next.js y DeepAgent**
```

### 2.2 CHANGELOG.md Actualizado
```markdown
# Changelog

## [2.1.0] - 2025-09-22

### ✨ Added
- **Sidebar navegacional sticky** para desktop
- **Navegación móvil** con Sheet/Drawer component
- **Layout Provider** centralizado para manejo de UI
- **Sistema de módulos PWA** mejorado con filtros dinámicos
- **Dark/Light theme** completo con persistencia
- **Header móvil** optimizado para touch devices
- **Responsive breakpoints** mejorados

### 🔄 Changed  
- **Header desktop** rediseñado con dropdown de usuario
- **Dashboard layout** actualizado para usar sidebar
- **Navegación por módulos** ahora categorizada
- **Performance** mejorado en cargas de módulos
- **TypeScript** tipos actualizados para nuevos componentes

### 🐛 Fixed
- **Hydration errors** eliminados en SSR
- **Mobile navigation** fluida sin glitches
- **Module permissions** verificación correcta por rol
- **Theme persistence** entre sesiones
- **Responsive design** consistente en todos los breakpoints

### 🔒 Security
- **Module access control** mejorado por rol
- **API routes** protegidas con middleware actualizado
- **Session management** optimizado

## [2.0.5] - 2025-09-20

### 🔧 Maintenance
- Dependencias actualizadas a versiones estables
- Performance optimizations
- Bug fixes menores

## [2.0.0] - 2025-09-15

### 🚀 Major Release
- Implementación completa del sistema EscalaFin
- Integración con OpenPay y EvolutionAPI
- Sistema de módulos PWA
- Dashboard analítico completo

---

Para ver el historial completo: [CHANGELOG_FULL.md](CHANGELOG_FULL.md)
```

---

## 🔧 Paso 3: GitHub Actions CI/CD

### 3.1 Workflow Principal (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'yarn'
        cache-dependency-path: 'app/yarn.lock'
    
    - name: Install dependencies
      working-directory: ./app
      run: yarn install --frozen-lockfile
    
    - name: Generate Prisma Client
      working-directory: ./app  
      run: yarn prisma generate
    
    - name: Run TypeScript check
      working-directory: ./app
      run: yarn tsc --noEmit
    
    - name: Run ESLint
      working-directory: ./app
      run: yarn lint
    
    - name: Run tests
      working-directory: ./app
      run: yarn test --coverage
    
    - name: Test Navigation Components
      working-directory: ./app
      run: yarn test --testPathPattern=navigation
    
    - name: Build application
      working-directory: ./app
      run: yarn build
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        NEXTAUTH_SECRET: test-secret-key
        NEXTAUTH_URL: http://localhost:3000

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to EasyPanel
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.EASYPANEL_HOST }}
        username: ${{ secrets.EASYPANEL_USER }}
        key: ${{ secrets.EASYPANEL_SSH_KEY }}
        script: |
          cd /app/escalafin-mvp
          git pull origin main
          cd app
          yarn install --frozen-lockfile
          yarn build
          pm2 restart escalafin-mvp
```

### 3.2 Workflow de Testing de Navegación (.github/workflows/test-navigation.yml)
```yaml
name: Navigation Tests

on:
  push:
    paths:
      - 'app/components/layout/**'
      - 'app/components/ui/sheet.tsx'
  pull_request:
    paths:
      - 'app/components/layout/**'

jobs:
  test-navigation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'yarn'
        cache-dependency-path: 'app/yarn.lock'
    
    - name: Install dependencies
      working-directory: ./app
      run: yarn install --frozen-lockfile
    
    - name: Test Sidebar Component
      working-directory: ./app
      run: yarn test --testPathPattern=sidebar
    
    - name: Test Mobile Navigation
      working-directory: ./app
      run: yarn test --testPathPattern=header-mobile
    
    - name: Test Layout Provider
      working-directory: ./app
      run: yarn test --testPathPattern=layout-provider
    
    - name: Visual Regression Tests
      working-directory: ./app
      run: yarn test:visual --testPathPattern=navigation
```

### 3.3 Workflow de Seguridad (.github/workflows/security.yml)
```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 6 * * 1' # Every Monday at 6 AM
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'yarn'
        cache-dependency-path: 'app/yarn.lock'
    
    - name: Install dependencies
      working-directory: ./app
      run: yarn install --frozen-lockfile
    
    - name: Run security audit
      working-directory: ./app
      run: yarn audit --audit-level high
    
    - name: Check for vulnerable packages
      working-directory: ./app
      run: npx better-npm-audit audit --level high
    
    - name: Scan for secrets
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📋 Paso 4: Templates de Issues y PRs

### 4.1 Bug Report (.github/ISSUE_TEMPLATE/bug_report.md)
```markdown
---
name: Bug Report
about: Reportar un problema o error
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## 🐛 Descripción del Bug
Una descripción clara y concisa del problema.

## 🔄 Pasos para Reproducir
1. Ve a '...'
2. Haz click en '....'
3. Desplázate hacia '....'
4. Ve el error

## ✅ Comportamiento Esperado
Descripción clara de lo que esperabas que sucediera.

## 📸 Screenshots
Si aplica, añade screenshots para ayudar a explicar el problema.

## 🧭 Navegación Específica
- [ ] Problema con sidebar desktop
- [ ] Problema con navegación móvil
- [ ] Problema con módulos PWA
- [ ] Problema con cambio de tema
- [ ] Otro (especifica):

## 💻 Desktop (llena la información relevante):
- OS: [e.g. Windows 11, macOS 13]
- Browser: [e.g. chrome 117, safari 16]
- Screen Resolution: [e.g. 1920x1080, 2560x1440]

## 📱 Mobile (llena la información relevante):
- Device: [e.g. iPhone 14, Samsung Galaxy S23]
- OS: [e.g. iOS 16.6, Android 13]
- Browser: [e.g. safari, chrome mobile]

## 🔍 Información Adicional
Cualquier otro contexto sobre el problema.

## 📝 Logs
Si es posible, incluye logs relevantes:
```
Pega logs aquí
```

## 🎯 Severidad
- [ ] Crítico (impide uso de la aplicación)
- [ ] Alto (funcionalidad importante rota)
- [ ] Medio (funcionalidad menor rota)
- [ ] Bajo (problema cosmético)
```

### 4.2 Feature Request (.github/ISSUE_TEMPLATE/feature_request.md)
```markdown
---
name: Feature Request
about: Proponer una nueva funcionalidad
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

## 🚀 Descripción de la Funcionalidad
Descripción clara y concisa de la funcionalidad que te gustaría agregar.

## 💡 ¿Es tu solicitud relacionada con un problema?
Una descripción clara y concisa del problema. Ej. "Me frustra que no pueda..."

## 💭 Solución Propuesta
Descripción clara y concisa de lo que te gustaría que pasara.

## 🧭 Área de Navegación
- [ ] Sidebar desktop
- [ ] Navegación móvil
- [ ] Módulos PWA
- [ ] Dashboard
- [ ] Reportes
- [ ] Configuración
- [ ] Otra (especifica):

## 🎨 Alternativas Consideradas
Descripción clara y concisa de soluciones alternativas que consideraste.

## 📸 Mockups o Referencias
Si tienes mockups, wireframes o referencias visuales, inclúyelos aquí.

## 🔧 Información Técnica
- ¿Requiere cambios en el backend?
- ¿Requiere nuevos permisos de usuario?
- ¿Afecta la performance?
- ¿Requiere nuevas dependencias?

## 🎯 Prioridad
- [ ] Crítica (necesaria inmediatamente)
- [ ] Alta (importante para próximo release)
- [ ] Media (deseable para futuras versiones)
- [ ] Baja (idea para el futuro)

## 📝 Información Adicional
Cualquier otro contexto o screenshots sobre la solicitud de funcionalidad.
```

### 4.3 Navigation Issue (.github/ISSUE_TEMPLATE/navigation_issue.md)
```markdown
---
name: Navigation Issue
about: Problemas específicos con navegación/sidebar
title: '[NAV] '
labels: 'navigation, ui'
assignees: ''
---

## 🧭 Tipo de Problema de Navegación
- [ ] Sidebar no se muestra
- [ ] Sidebar no colapsa/expande
- [ ] Navegación móvil no responde
- [ ] Módulos no se filtran correctamente
- [ ] Indicador de página activa incorrecto
- [ ] Performance lenta en navegación
- [ ] Otro:

## 📱 Dispositivo/Viewport
- [ ] Desktop (>= 1024px)
- [ ] Tablet (768px - 1023px)  
- [ ] Mobile (< 768px)
- [ ] Todos los tamaños

## 👤 Rol de Usuario
- [ ] ADMIN
- [ ] ASESOR  
- [ ] CLIENTE
- [ ] No autenticado

## 🔄 Pasos para Reproducir
1. Inicia sesión como [rol]
2. Navega a [página]
3. [acción específica]
4. Ve el problema

## ✅ Comportamiento Esperado
Descripción del comportamiento correcto esperado.

## ❌ Comportamiento Actual  
Descripción del comportamiento incorrecto observado.

## 📸 Screenshots/Video
Incluye screenshots o video del problema (especialmente útil para problemas de UI).

## 🔍 Console Errors
Si hay errores en la consola del navegador:
```
Pega errores aquí
```

## 🌐 Información del Browser
- Browser: [Chrome/Firefox/Safari/Edge]
- Versión: [ej. 117.0.0.0]
- OS: [Windows/macOS/Linux/iOS/Android]

## 📝 Información Adicional
Cualquier contexto adicional sobre el problema de navegación.
```

### 4.4 Pull Request Template (.github/PULL_REQUEST_TEMPLATE.md)
```markdown
## 📋 Descripción

Breve descripción de los cambios incluidos en este PR.

## 🎯 Tipo de Cambio

- [ ] 🐛 Bug fix (cambio que corrige un problema)
- [ ] ✨ Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o funcionalidad que causa que funcionalidad existente no funcione como se esperaba)
- [ ] 📚 Documentación (cambios solo en documentación)
- [ ] 🎨 Estilos (formateo, punto y coma faltante, etc; sin cambios en código)
- [ ] ♻️ Refactor (refactoring de código de producción)
- [ ] ⚡ Performance (cambios que mejoran performance)
- [ ] 🧪 Tests (añadiendo tests faltantes, refactoring tests)
- [ ] 🔧 Chores (actualización de build tasks, configuraciones de package manager, etc)

## 🧭 Navegación/UI

- [ ] Cambios en sidebar desktop
- [ ] Cambios en navegación móvil
- [ ] Cambios en módulos PWA
- [ ] Cambios en layout/estructura
- [ ] Cambios en tema dark/light
- [ ] Sin cambios de navegación/UI

## 🧪 Testing

- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] Tests de navegación pasando
- [ ] Tested en desktop
- [ ] Tested en mobile
- [ ] Tested en múltiples browsers

## 📱 Dispositivos Testados

- [ ] Desktop (Chrome/Firefox/Safari/Edge)
- [ ] Tablet (iPad/Android tablet)
- [ ] Mobile (iPhone/Android phone)

## 👤 Roles Testados

- [ ] ADMIN
- [ ] ASESOR
- [ ] CLIENTE

## 📸 Screenshots

Si hay cambios visuales, incluye screenshots antes/después:

### Antes
[Screenshot]

### Después  
[Screenshot]

## 📝 Checklist

- [ ] Mi código sigue las convenciones de estilo del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He hecho cambios correspondientes a la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He añadido tests que prueban que mi fix es efectivo o que mi funcionalidad funciona
- [ ] Tests unitarios nuevos y existentes pasan localmente con mis cambios
- [ ] Cualquier cambio dependiente ha sido merged y publicado en módulos downstream

## 🔗 Issues Relacionados

Fixes #(número de issue)
Closes #(número de issue)
Relates to #(número de issue)

## 📝 Notas Adicionales

Cualquier información adicional para los reviewers.
```

---

## 👥 Paso 5: Configuración de Colaboradores

### 5.1 CODEOWNERS (.github/CODEOWNERS)
```bash
# Global owners
* @tu-usuario @lead-dev

# Frontend/UI components
/app/components/ @frontend-team @ui-specialist

# Navigation components (specific ownership)
/app/components/layout/ @navigation-lead @tu-usuario

# Backend/API routes  
/app/api/ @backend-team

# Database/Prisma
/app/prisma/ @db-admin @backend-team

# Documentation
/docs/ @docs-team @tu-usuario

# CI/CD workflows
/.github/ @devops-team @tu-usuario

# Package management
/app/package.json @lead-dev
/app/yarn.lock @lead-dev

# Environment configs
*.env* @devops-team @security-team

# Deployment configs
Dockerfile @devops-team
docker-compose.yml @devops-team
```

### 5.2 Branch Protection Rules
```json
{
  "branch": "main",
  "protection": {
    "required_status_checks": {
      "strict": true,
      "checks": [
        "test (18.x)",
        "test (20.x)",
        "test-navigation"
      ]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 2,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": {
      "users": ["tu-usuario", "lead-dev"],
      "teams": ["core-team"]
    }
  }
}
```

---

## 🏷️ Paso 6: Releases y Tags

### 6.1 Release Workflow (.github/workflows/release.yml)
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'yarn'
        cache-dependency-path: 'app/yarn.lock'
    
    - name: Install dependencies
      working-directory: ./app
      run: yarn install --frozen-lockfile
    
    - name: Build application
      working-directory: ./app
      run: yarn build
    
    - name: Generate changelog
      id: changelog
      run: |
        echo "## What's Changed" > RELEASE_CHANGELOG.md
        git log $(git describe --tags --abbrev=0 HEAD^)..HEAD --pretty=format:"- %s" >> RELEASE_CHANGELOG.md
    
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: EscalaFin ${{ github.ref }}
        body_path: RELEASE_CHANGELOG.md
        draft: false
        prerelease: false
    
    - name: Deploy to production
      if: startsWith(github.ref, 'refs/tags/v')
      run: |
        echo "Deploying to production..."
        # Add deployment script here
```

### 6.2 Version Tagging Strategy
```bash
# Semantic Versioning
# MAJOR.MINOR.PATCH

# Major (2.0.0): Breaking changes
# Minor (2.1.0): New features (sidebar navigation)
# Patch (2.1.1): Bug fixes

# Crear nuevo tag
git tag -a v2.1.0 -m "v2.1.0 - Sidebar Navigation Implementation"
git push origin v2.1.0

# Tags con releases
git tag -a v2.1.0 -m "v2.1.0 - Features:
- Sidebar navegacional sticky
- Navegación móvil con Sheet
- Layout Provider centralizado
- Dark/Light theme completo"
```

---

## 📚 Paso 7: Documentación Técnica

### 7.1 Navigation Guide (docs/NAVIGATION.md)
```markdown
# 🧭 Guía de Navegación EscalaFin

## Arquitectura de Navegación

EscalaFin implementa un sistema de navegación dual:
- **Desktop**: Sidebar sticky colapsible
- **Mobile**: Header con menú hamburguesa + Sheet drawer

## Componentes Principales

### Sidebar Desktop
- **Archivo**: `app/components/layout/sidebar.tsx`
- **Características**:
  - Colapsible/expandible
  - Categorización de módulos
  - Filtrado por rol de usuario
  - Indicador de página activa
  - Avatar y info de usuario

### Header Mobile
- **Archivo**: `app/components/layout/header-mobile.tsx`
- **Características**:
  - Solo visible en breakpoints móviles
  - Menú hamburguesa
  - Sheet drawer deslizante
  - Navegación completa

### Layout Provider
- **Archivo**: `app/components/layout/layout-provider.tsx`
- **Propósito**: Gestión centralizada de layout y navegación

## Breakpoints Responsive

```css
/* Tailwind breakpoints */
sm: 640px
md: 768px   /* Punto de cambio mobile/desktop */
lg: 1024px
xl: 1280px
```

## Estructura de Módulos

Los módulos se organizan en categorías:

1. **Principal**: Dashboard
2. **Gestión**: Clientes, Préstamos, Pagos, Usuarios
3. **Reportes**: Portfolio, Cobranza, Analíticos
4. **Comunicación**: WhatsApp, Notificaciones
5. **Configuración**: Módulos PWA, Sistema

## Permisos y Filtrado

```typescript
// Lógica de filtrado por rol
const getFilteredItems = (items: NavigationItem[]) => {
  return items.filter(item => {
    // Verificar rol
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    
    // Verificar módulo habilitado
    if (item.moduleKey) {
      return modules.some(module => module.moduleKey === item.moduleKey);
    }
    
    return true;
  });
};
```

## Testing de Navegación

```bash
# Tests específicos de navegación
yarn test --testPathPattern=navigation

# Tests de sidebar
yarn test components/layout/sidebar.test.tsx

# Tests de navegación móvil
yarn test components/layout/header-mobile.test.tsx
```
```

### 7.2 Sidebar Guide (docs/SIDEBAR_GUIDE.md)
```markdown
# 📋 Guía del Sidebar - EscalaFin

## Implementación Técnica

### Estructura del Componente
```tsx
<Sidebar>
  <SidebarHeader>
    <Logo />
    <CollapseToggle />
  </SidebarHeader>
  
  <SidebarNavigation>
    {categories.map(category => (
      <NavigationCategory key={category.name}>
        <CategoryTitle />
        <NavigationItems />
      </NavigationCategory>
    ))}
  </SidebarNavigation>
  
  <SidebarFooter>
    <UserInfo />
  </SidebarFooter>
</Sidebar>
```

### Estados del Sidebar

1. **Expandido** (default, >= 768px)
   - Ancho: 256px (w-64)
   - Muestra iconos + etiquetas
   - Info completa del usuario

2. **Colapsado** (usuario toggle)
   - Ancho: 64px (w-16) 
   - Solo iconos
   - Avatar del usuario

3. **Oculto** (< 768px)
   - display: none en mobile
   - Se usa HeaderMobile en su lugar

### Animaciones y Transiciones

```css
.sidebar {
  transition: width 300ms ease-in-out;
}

.sidebar-item {
  transition: all 200ms ease-in-out;
}
```

### Personalización

Para agregar nuevos módulos al sidebar:

1. Agregar al enum `navigationItems` en sidebar.tsx
2. Definir `moduleKey`, `roles` y `category`
3. Asegurar que el módulo esté en la base de datos PWAModule

### Troubleshooting

**Problema**: Sidebar no aparece
- Verificar breakpoint CSS (>= md)
- Verificar session activa
- Verificar módulos PWA en base de datos

**Problema**: Módulos no se filtran
- Verificar `useModules` hook
- Verificar permisos en PWAModule table
- Verificar rol del usuario en sesión
```

---

## 🔄 Paso 8: Integración Continua Avanzada

### 8.1 Dependabot Configuration (.github/dependabot.yml)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/app"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
    open-pull-requests-limit: 10
    reviewers:
      - "tu-usuario"
      - "lead-dev"
    assignees:
      - "devops-team"
    commit-message:
      prefix: "deps"
      include: "scope"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "ci"
```

### 8.2 Code Quality (.github/workflows/code-quality.yml)
```yaml
name: Code Quality

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18.x'
        cache: 'yarn'
        cache-dependency-path: 'app/yarn.lock'
    
    - name: Install dependencies
      working-directory: ./app
      run: yarn install --frozen-lockfile
    
    - name: Run ESLint with annotations
      working-directory: ./app
      run: yarn lint --format=@microsoft/eslint-formatter-sarif --output-file=eslint-results.sarif
      continue-on-error: true
    
    - name: Upload ESLint results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: app/eslint-results.sarif
        wait-for-processing: true
    
    - name: Check bundle size
      working-directory: ./app
      run: |
        yarn build
        npx @next/bundle-analyzer
```

---

## 📊 Paso 9: Métricas y Analytics

### 9.1 GitHub Insights Setup
```markdown
# Configurar GitHub Insights

1. **Pulse**: Activar métricas de commits, PRs, issues
2. **Contributors**: Tracking de contribuciones
3. **Traffic**: Análisis de clones y visits
4. **Code frequency**: Análisis de cambios en código
5. **Dependency graph**: Análisis de dependencias
6. **Security alerts**: Alertas de vulnerabilidades
```

### 9.2 Performance Monitoring
```javascript
// next.config.js - Analytics
module.exports = {
  experimental: {
    instrumentationHook: true
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Bundle analyzer en build
      config.plugins.push(
        new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
          analyzerMode: 'static',
          reportFilename: './analyze/client.html'
        })
      );
    }
    return config;
  }
};
```

---

## 🚀 Paso 10: Despliegue y Entrega

### 10.1 Deployment Strategy
```yaml
# Estrategia de deployment
branches:
  develop: → staging.escalafin.com
  main: → production.escalafin.com
  feature/*: → preview deploys

environments:
  - development (local)
  - staging (testing)
  - production (live)
```

### 10.2 Release Checklist
```markdown
## Pre-Release Checklist

### Code Quality
- [ ] All tests passing
- [ ] No TypeScript errors  
- [ ] No ESLint warnings
- [ ] Bundle size acceptable
- [ ] Performance tests pass

### Navigation Testing
- [ ] Sidebar funciona en desktop
- [ ] Mobile navigation responsive
- [ ] All breakpoints tested
- [ ] Module filtering works
- [ ] Theme switching works

### Cross-Browser Testing  
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Documentation
- [ ] README actualizado
- [ ] CHANGELOG actualizado
- [ ] API docs actualizados
- [ ] Screenshots actualizados

### Security
- [ ] Dependencies auditadas
- [ ] No secrets en código
- [ ] HTTPS enforced
- [ ] CSP headers configurados

### Performance
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals verde
- [ ] Bundle size optimizado
- [ ] Images optimizadas
```

---

## ✅ Checklist Final GitHub Setup

### Repositorio Base
- [ ] ✅ Repositorio creado con descripción clara
- [ ] ✅ README.md completo y actualizado
- [ ] ✅ CHANGELOG.md con historial de versiones
- [ ] ✅ .gitignore configurado correctamente
- [ ] ✅ LICENSE incluida

### Documentation
- [ ] ✅ Guía de navegación (NAVIGATION.md)
- [ ] ✅ Guía del sidebar (SIDEBAR_GUIDE.md)
- [ ] ✅ Guía móvil (MOBILE_UX.md)
- [ ] ✅ API documentation
- [ ] ✅ Contributing guidelines

### CI/CD
- [ ] ✅ GitHub Actions configuradas
- [ ] ✅ Tests automatizados
- [ ] ✅ Security scanning
- [ ] ✅ Dependency updates
- [ ] ✅ Deploy automation

### Issue Management
- [ ] ✅ Issue templates configurados
- [ ] ✅ PR template configurado
- [ ] ✅ Labels organizados
- [ ] ✅ Milestones definidos

### Security & Quality
- [ ] ✅ Branch protection rules
- [ ] ✅ CODEOWNERS configurado
- [ ] ✅ Security policy definida
- [ ] ✅ Code quality checks

### Integration
- [ ] ✅ EasyPanel integration
- [ ] ✅ DeepAgent compatibility
- [ ] ✅ External services docs
- [ ] ✅ Environment configs

---

*Guía actualizada: Septiembre 2025*
*EscalaFin v2.1.0 - Includes Sidebar Navigation*
*Compatible con GitHub Actions 2025*
