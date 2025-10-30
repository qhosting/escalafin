
# 🚀 Plantilla Base para Proyectos Next.js con Docker y PostgreSQL

Esta plantilla incluye todos los archivos esenciales, scripts de validación, y herramientas de deployment probadas en producción.

## 📦 ¿Qué Incluye?

### 1. Archivos Docker Optimizados
- ✅ `Dockerfile` - Multi-stage optimizado (Node 18-alpine)
- ✅ `docker-compose.yml` - Para desarrollo local
- ✅ `docker-compose.easypanel.yml` - Para deployment en EasyPanel
- ✅ `.dockerignore` - Optimizado para builds rápidos

### 2. Scripts de Validación y Prevención
- ✅ `pre-build-check.sh` - Validación antes de build Docker
- ✅ `pre-deploy-check.sh` - Validación antes de deployment
- ✅ `validate-absolute-paths.sh` - Detecta rutas absolutas problemáticas
- ✅ `pre-push-check.sh` - Validación antes de push a GitHub

### 3. Scripts de Deployment
- ✅ `start-improved.sh` - Startup robusto con reintentos
- ✅ `emergency-start.sh` - Startup de emergencia sin migraciones
- ✅ `healthcheck.sh` - Health check para Docker

### 4. Scripts de Mantenimiento
- ✅ `backup-db.sh` - Backup de base de datos
- ✅ `restore-db.sh` - Restauración de base de datos
- ✅ `cache-diagnostics.sh` - Diagnóstico de problemas de cache
- ✅ `diagnose-db.sh` - Diagnóstico de problemas de BD

### 5. Scripts de Git
- ✅ `push-github.sh` - Push seguro con validaciones
- ✅ `setup-git-hooks.sh` - Configuración de Git hooks

### 6. Documentación
- ✅ Guías de deployment para diferentes plataformas
- ✅ Checklist de pre-deployment
- ✅ Troubleshooting común

---

## 🎯 Cómo Usar Esta Plantilla

### Paso 1: Copiar Archivos al Nuevo Proyecto

```bash
# Crear estructura del nuevo proyecto
mkdir mi-nuevo-proyecto
cd mi-nuevo-proyecto

# Copiar template
cp -r /ruta/al/template/* .

# Inicializar Git
git init
git add .
git commit -m "Initial commit from template"
```

### Paso 2: Personalizar para tu Proyecto

1. **Actualizar `package.json`**
   - Cambiar nombre del proyecto
   - Actualizar descripción
   - Revisar dependencias

2. **Actualizar variables en scripts**
   ```bash
   # Editar estos archivos con el nombre de tu proyecto:
   - docker-compose.yml
   - docker-compose.easypanel.yml
   - scripts/push-github.sh
   ```

3. **Configurar Prisma Schema**
   - Actualizar `prisma/schema.prisma` con tus modelos
   - Asegurar que el output sea relativo:
     ```prisma
     generator client {
       provider = "prisma-client-js"
       output   = "../node_modules/.prisma/client"
     }
     ```

### Paso 3: Validar Antes de Deployment

```bash
# Ejecutar todas las validaciones
bash scripts/pre-build-check.sh
bash scripts/pre-deploy-check.sh
bash scripts/validate-absolute-paths.sh
```

### Paso 4: Build y Deploy

```bash
# Desarrollo local
docker-compose up --build

# EasyPanel (después de push a GitHub)
# 1. Configurar servicio en EasyPanel
# 2. Conectar con GitHub
# 3. EasyPanel automáticamente usará el Dockerfile
```

---

## 📋 Checklist de Pre-Deployment

- [ ] `pre-build-check.sh` ejecutado sin errores
- [ ] `pre-deploy-check.sh` ejecutado sin errores
- [ ] Variables de entorno configuradas en EasyPanel
- [ ] Base de datos PostgreSQL configurada
- [ ] Secrets (JWT_SECRET, etc.) generados
- [ ] Prisma schema tiene output relativo
- [ ] `.dockerignore` incluye `node_modules/`
- [ ] `yarn.lock` en el root del proyecto
- [ ] Scripts de inicio tienen permisos de ejecución

---

## 🔧 Scripts Principales

### Validación

```bash
# Validar antes de build Docker
bash scripts/pre-build-check.sh

# Validar antes de deployment
bash scripts/pre-deploy-check.sh

# Validar rutas absolutas en Prisma/configs
bash scripts/validate-absolute-paths.sh

# Validar antes de push a GitHub
bash scripts/pre-push-check.sh
```

### Deployment

```bash
# Inicio normal (con migraciones)
bash start-improved.sh

# Inicio de emergencia (sin migraciones)
bash emergency-start.sh

# Verificar salud del servicio
bash healthcheck.sh
```

### Mantenimiento

```bash
# Backup de base de datos
bash backup-db.sh

# Restaurar base de datos
bash restore-db.sh

# Diagnosticar problemas
bash scripts/cache-diagnostics.sh
bash scripts/diagnose-db.sh
```

---

## 🐳 Dockerfile Características

### Multi-Stage Build
1. **deps** - Instalar dependencias de producción
2. **builder** - Build de Next.js
3. **runner** - Imagen final optimizada

### Optimizaciones
- ✅ Node 18-alpine (imagen pequeña)
- ✅ Prisma Client generado correctamente
- ✅ Standalone output para menor tamaño
- ✅ Cache de layers optimizado
- ✅ Health check integrado

### Tamaño Final
- Imagen base: ~150 MB
- Con dependencias: ~400-600 MB

---

## 📊 Variables de Entorno Requeridas

### Base de Datos
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### NextAuth
```bash
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="generar-con-script"
JWT_SECRET="generar-con-script"
```

### Generar Secrets
```bash
node generar-secretos.js
```

---

## 🚨 Troubleshooting Común

### Error: "Prisma Client no generado"
```bash
# Verificar output en schema.prisma
output = "../node_modules/.prisma/client"  # ✅ Relativo
# NO usar rutas absolutas

# Regenerar cliente
cd app && yarn prisma generate
```

### Error: "Cannot find module"
```bash
# Verificar yarn.lock en root
ls -la yarn.lock

# Si es symlink, copiar el archivo real
cp app/yarn.lock ./yarn.lock
```

### Error: "ENOENT: no such file or directory"
```bash
# Ejecutar validación de rutas absolutas
bash scripts/validate-absolute-paths.sh

# Corregir rutas en los archivos reportados
```

### Build muy lento
```bash
# Verificar .dockerignore
cat .dockerignore

# Debe incluir:
node_modules/
.next/
.git/
*.log
```

---

## 📚 Documentación Adicional

### Guías Incluidas
- `docs/DEPLOYMENT.md` - Guía completa de deployment
- `docs/EASYPANEL_SETUP.md` - Configuración específica para EasyPanel
- `docs/TROUBLESHOOTING.md` - Problemas comunes y soluciones
- `docs/SCRIPTS_REFERENCE.md` - Referencia completa de scripts

---

## ✅ Features Probados en Producción

- ✅ Build Docker exitoso en múltiples plataformas
- ✅ Deployment en EasyPanel/Coolify
- ✅ Migraciones Prisma automáticas
- ✅ Health checks funcionales
- ✅ Manejo de errores robusto
- ✅ Rollback automático en caso de fallo
- ✅ Backup/restore de BD

---

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Dependencias
```bash
cd app
yarn upgrade-interactive --latest
```

### Actualizar Scripts
Los scripts se mantienen en el template original. Para actualizarlos:
```bash
# Desde el proyecto original (escalafin_mvp)
cd template
git pull origin main
```

---

## 📝 Licencia

Esta plantilla está basada en el proyecto EscalaFin MVP y está disponible para uso en proyectos derivados.

---

## 🆘 Soporte

Si encuentras problemas con la plantilla:
1. Revisa la documentación en `docs/`
2. Ejecuta los scripts de diagnóstico
3. Verifica que seguiste todos los pasos del checklist

---

**Plantilla creada:** Octubre 2025  
**Basada en:** EscalaFin MVP  
**Tecnologías:** Next.js 14, PostgreSQL, Prisma, Docker, Yarn
