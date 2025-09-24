
# 📂 Configuración para GitHub - EscalaFin

## 🚀 Preparación para Subir a GitHub

Esta guía te ayuda a configurar el repositorio GitHub para EscalaFin con todas las mejores prácticas.

---

## 📋 Checklist Pre-GitHub

### ✅ **Archivos a Revisar Antes de Subir**

#### 1. Verificar .gitignore
```gitignore
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/.build

# Misc
.DS_Store
*.tgz
*.tar.gz

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# Prisma
/prisma/migrations/

# IDE
.vscode/
.idea/

# OS
Thumbs.db

# Custom
/uploads
/backups
*.log
```

#### 2. Limpiar Archivos Sensibles
```bash
# Eliminar archivos que no deben estar en GitHub
rm -f .env
rm -f .env.local
rm -f .env.production
rm -rf node_modules
rm -rf .next
rm -rf uploads
rm -f *.log
```

#### 3. Crear .env.example
```env
# Base de Datos
DATABASE_URL="postgresql://user:password@localhost:5432/escalafin"

# Autenticación
NEXTAUTH_SECRET="tu_secreto_super_seguro_de_32_caracteres_o_mas"
NEXTAUTH_URL="http://localhost:3000"

# Ambiente
NODE_ENV="development"
NEXTAUTH_DEBUG=false

# Openpay (Pagos)
OPENPAY_MERCHANT_ID="tu_merchant_id"
OPENPAY_PRIVATE_KEY="tu_private_key"
OPENPAY_PUBLIC_KEY="tu_public_key"
OPENPAY_BASE_URL="https://sandbox-api.openpay.mx/v1"

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
```

---

## 🏗️ Estructura de Carpetas para GitHub

```
escalafin_mvp/
├── app/                          # Aplicación principal
│   ├── api/                      # API Routes
│   ├── app/                      # Páginas y layouts
│   ├── components/               # Componentes React
│   ├── lib/                      # Utilidades
│   ├── prisma/                   # Base de datos
│   ├── public/                   # Archivos estáticos
│   ├── .env.example              # Variables de entorno ejemplo
│   ├── package.json              # Dependencias
│   └── next.config.js            # Configuración Next.js
├── docs/                         # Documentación adicional
├── .github/                      # Workflows y templates
├── .gitignore                    # Archivos ignorados
├── README.md                     # Documentación principal
├── DEPLOYMENT_GUIDE.md           # Guía de despliegue
├── LICENSE                       # Licencia
└── CONTRIBUTING.md               # Guía de contribución
```

---

## ⚙️ Configurar GitHub Actions

### .github/workflows/ci.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: escalafin_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
        cache-dependency-path: app/yarn.lock
    
    - name: Install dependencies
      run: |
        cd app
        yarn install --frozen-lockfile
    
    - name: Generate Prisma Client
      run: |
        cd app
        yarn prisma generate
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/escalafin_test
    
    - name: Run TypeScript Check
      run: |
        cd app
        yarn tsc --noEmit
    
    - name: Run Linting
      run: |
        cd app
        yarn lint
    
    - name: Build Application
      run: |
        cd app
        yarn build
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/escalafin_test
        NEXTAUTH_SECRET: test_secret_for_ci
        NEXTAUTH_URL: http://localhost:3000

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Security Audit
      run: |
        cd app
        npm audit --audit-level=moderate
```

### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
        cache-dependency-path: app/yarn.lock
    
    - name: Install dependencies
      run: |
        cd app
        yarn install --frozen-lockfile
    
    - name: Build
      run: |
        cd app
        yarn build
    
    - name: Deploy to Production
      # Aquí agregarías los pasos específicos para tu plataforma
      # Ejemplo para Easypanel, Vercel, etc.
      run: echo "Deploying to production..."
```

---

## 📝 Issues y PR Templates

### .github/ISSUE_TEMPLATE/bug_report.md
```markdown
---
name: Bug Report
about: Crear un reporte de bug para ayudar a mejorar EscalaFin
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## 🐛 Descripción del Bug
Una descripción clara y concisa del bug.

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Scrollear hacia abajo a '...'
4. Ver error

## ✅ Comportamiento Esperado
Una descripción clara de lo que esperabas que pasara.

## 📸 Screenshots
Si es aplicable, agrega screenshots para explicar el problema.

## 💻 Información del Sistema
- OS: [e.g. iOS]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]
- Rol de usuario: [Admin/Asesor/Cliente]

## 📋 Contexto Adicional
Agrega cualquier otro contexto sobre el problema aquí.
```

### .github/ISSUE_TEMPLATE/feature_request.md
```markdown
---
name: Feature Request
about: Sugerir una nueva funcionalidad para EscalaFin
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

## 🚀 Descripción de la Funcionalidad
Una descripción clara y concisa de lo que quieres que suceda.

## 💡 Motivación
Describe el problema o la necesidad que esta funcionalidad resolvería.

## 🎯 Solución Propuesta
Una descripción clara y concisa de lo que quieres que suceda.

## 🔄 Alternativas Consideradas
Una descripción clara y concisa de cualquier solución o funcionalidad alternativa que hayas considerado.

## 📋 Información Adicional
Agrega cualquier otro contexto o screenshots sobre la solicitud de funcionalidad aquí.
```

### .github/pull_request_template.md
```markdown
## 📋 Descripción
Breve descripción de los cambios realizados.

## 🔄 Tipo de Cambio
- [ ] Bug fix (cambio no breaking que arregla un issue)
- [ ] Nueva funcionalidad (cambio no breaking que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se esperaba)
- [ ] Documentación (cambios solo en documentación)

## ✅ Checklist
- [ ] Mi código sigue las guías de estilo del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He realizado cambios correspondientes a la documentación
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests unitarios nuevos y existentes pasan localmente con mis cambios

## 🧪 Pruebas Realizadas
Describe las pruebas que ejecutaste para verificar tus cambios.

## 📸 Screenshots
Si aplica, agrega screenshots de los cambios de UI.
```

---

## 🔒 Configuraciones de Seguridad

### .github/dependabot.yml
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/app"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "tu-usuario-github"
    assignees:
      - "tu-usuario-github"
```

---

## 📄 Archivos Adicionales

### CONTRIBUTING.md
```markdown
# Contribuyendo a EscalaFin

## 🤝 Cómo Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📋 Guías de Estilo

### Código
- Usar TypeScript estricto
- Seguir convenciones de ESLint/Prettier
- Documentar funciones complejas
- Usar nombres descriptivos

### Commits
Seguir [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` cambios en documentación
- `style:` cambios de formato
- `refactor:` refactorización de código
- `test:` agregar o modificar tests

### Pull Requests
- Título descriptivo
- Descripción detallada de cambios
- Screenshots si hay cambios de UI
- Tests actualizados
```

### LICENSE
```
Licencia Propietaria - EscalaFin

Copyright (c) 2025 [Tu Empresa/Nombre]

Todos los derechos reservados.

Este software y la documentación asociada son propiedad de [Tu Empresa/Nombre].
No está permitida la reproducción, distribución o creación de obras derivadas
sin autorización expresa por escrito del propietario.

Para consultas sobre licenciamiento: contacto@tuempresa.com
```

---

## 🚀 Comandos para Subir a GitHub

### 1. Inicializar Repositorio Local
```bash
cd /home/ubuntu/escalafin_mvp
git init
git add .
git commit -m "feat: initial commit - EscalaFin v3.0 complete system"
```

### 2. Crear Repositorio en GitHub
1. Ir a GitHub → New Repository
2. Nombre: `escalafin-mvp`
3. Descripción: "Sistema Integral de Gestión de Préstamos y Créditos"
4. Privado (recomendado para código comercial)
5. NO inicializar con README (ya lo tienes)

### 3. Conectar y Subir
```bash
git remote add origin https://github.com/tu-usuario/escalafin-mvp.git
git branch -M main
git push -u origin main
```

### 4. Configurar Branches
```bash
# Crear branch de desarrollo
git checkout -b develop
git push -u origin develop

# Configurar branch principal protegida en GitHub
# Settings → Branches → Add rule → main
```

---

## 🎯 Mejores Prácticas

### 🔐 **Seguridad**
- ✅ Nunca commitear archivos `.env`
- ✅ Usar `.env.example` para documentar variables
- ✅ Configurar branch protection rules
- ✅ Habilitar security advisories
- ✅ Configurar Dependabot

### 📋 **Documentación**
- ✅ README.md completo y actualizado
- ✅ Comentarios en código complejo
- ✅ Documentación de APIs
- ✅ Changelog para releases

### 🔄 **Workflows**
- ✅ CI/CD pipeline configurado
- ✅ Tests automáticos
- ✅ Security scanning
- ✅ Code quality checks

---

## 🎉 **¡Repositorio Listo para GitHub!**

Con esta configuración tendrás:
- ✅ **Repositorio profesional** y bien organizado
- ✅ **CI/CD automatizado** con GitHub Actions
- ✅ **Seguridad** configurada correctamente
- ✅ **Documentación completa** y profesional
- ✅ **Templates** para issues y PRs
- ✅ **Protección** de datos sensibles

**¡Tu proyecto EscalaFin está listo para ser el repositorio más profesional de GitHub!** 🚀
