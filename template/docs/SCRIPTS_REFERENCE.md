
# 📚 Referencia Completa de Scripts

Esta guía documenta todos los scripts incluidos en la plantilla y su uso.

---

## 🔍 Scripts de Validación

### `scripts/pre-build-check.sh`
**Propósito:** Validar que el proyecto está listo para build Docker

**Verificaciones:**
- ✅ Dockerfile existe y es válido
- ✅ package.json existe
- ✅ yarn.lock está presente
- ✅ Prisma schema tiene output relativo
- ✅ No hay rutas absolutas problemáticas
- ✅ .dockerignore está configurado correctamente
- ✅ Scripts de inicio tienen permisos de ejecución

**Uso:**
```bash
bash scripts/pre-build-check.sh
```

**Cuándo usar:**
- Antes de hacer build Docker
- Antes de push a GitHub
- Después de cambios en Prisma schema
- Después de cambios en configuración Docker

**Salida exitosa:**
```
✅ PRE-BUILD CHECK COMPLETADO
Total verificaciones: 15
Errores: 0
Advertencias: 0
```

---

### `scripts/pre-deploy-check.sh`
**Propósito:** Validar configuración antes de deployment

**Verificaciones:**
- ✅ Variables de entorno necesarias
- ✅ Conectividad a base de datos
- ✅ Prisma Client generado
- ✅ Build de Next.js funcional
- ✅ Migrations disponibles

**Uso:**
```bash
bash scripts/pre-deploy-check.sh
```

**Variables de entorno requeridas:**
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

**Cuándo usar:**
- Antes de deployment a producción
- Después de cambios en variables de entorno
- Después de cambios en schema de BD

---

### `scripts/validate-absolute-paths.sh`
**Propósito:** Detectar rutas absolutas que causan problemas en Docker

**Archivos verificados:**
- `prisma/schema.prisma`
- `next.config.js`
- `package.json`
- Archivos de configuración

**Uso:**
```bash
bash scripts/validate-absolute-paths.sh
```

**Rutas problemáticas detectadas:**
- `/home/ubuntu/...`
- `/root/...`
- Rutas absolutas del sistema

**Corrección automática:**
- NO - Solo reporta problemas
- Debes corregir manualmente

**Cuándo usar:**
- Después de modificar Prisma schema
- Si ves errores "ENOENT" en Docker
- Antes de cada deployment

---

### `scripts/pre-push-check.sh`
**Propósito:** Validar antes de push a GitHub

**Verificaciones:**
- ✅ pre-build-check pasa
- ✅ validate-absolute-paths pasa
- ✅ No hay node_modules en staging
- ✅ yarn.lock no es symlink
- ✅ Commits tienen mensajes descriptivos

**Uso:**
```bash
bash scripts/pre-push-check.sh
```

**Cuándo usar:**
- Antes de cada `git push`
- Automático con Git hooks

**Configurar como Git hook:**
```bash
bash scripts/setup-git-hooks.sh
```

---

## 🚀 Scripts de Deployment

### `start-improved.sh`
**Propósito:** Inicio robusto con reintentos y validaciones

**Características:**
- ✅ Validación de variables de entorno
- ✅ Espera a que base de datos esté disponible
- ✅ Ejecuta migraciones Prisma
- ✅ Genera Prisma Client si es necesario
- ✅ Seed opcional
- ✅ Reintentos automáticos
- ✅ Rollback en caso de error

**Uso:**
```bash
bash start-improved.sh
```

**Variables de entorno:**
```bash
DATABASE_URL=required
NEXTAUTH_URL=required
NEXTAUTH_SECRET=required
SKIP_MIGRATIONS=false  # opcional
SKIP_SEED=false        # opcional
MAX_RETRIES=3          # opcional
```

**Logs:**
- Ubicación: `./logs/startup-YYYYMMDD-HHMMSS.log`

**Cuándo usar:**
- Startup normal en producción
- Después de deployment
- Restart de contenedor

---

### `emergency-start.sh`
**Propósito:** Inicio de emergencia sin migraciones

**Características:**
- ✅ NO ejecuta migraciones (más rápido)
- ✅ Inicia servicio inmediatamente
- ✅ Útil cuando hay problemas con BD

**Uso:**
```bash
bash emergency-start.sh
```

**Cuándo usar:**
- Cuando migraciones fallan
- Deployment urgente
- Problemas con base de datos
- Rollback rápido

**⚠️ Advertencia:**
- No ejecuta migraciones
- Schema de BD puede estar desactualizado
- Usar solo en emergencias

---

### `healthcheck.sh`
**Propósito:** Verificar salud del servicio

**Verificaciones:**
- ✅ Puerto 3000 respondiendo
- ✅ Next.js está activo
- ✅ Base de datos conectada (opcional)

**Uso:**
```bash
bash healthcheck.sh
```

**Códigos de salida:**
- `0` - Servicio saludable
- `1` - Servicio con problemas

**Integración Docker:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD ["bash", "healthcheck.sh"]
```

**Cuándo usar:**
- Integrado en Docker (automático)
- Verificación manual del servicio
- Debugging de problemas

---

## 🔧 Scripts de Mantenimiento

### `backup-db.sh`
**Propósito:** Crear backup de base de datos PostgreSQL

**Uso:**
```bash
bash backup-db.sh
```

**Salida:**
- Archivo: `backup-YYYYMMDD-HHMMSS.sql`
- Ubicación: `./backups/`

**Requiere:**
- Variable `DATABASE_URL` configurada
- `pg_dump` instalado

**Cuándo usar:**
- Antes de migraciones grandes
- Antes de deployment importante
- Backup programado (cron)

**Configurar backup automático:**
```bash
# Crontab - backup diario a las 2 AM
0 2 * * * cd /app && bash backup-db.sh
```

---

### `restore-db.sh`
**Propósito:** Restaurar base de datos desde backup

**Uso:**
```bash
bash restore-db.sh backup-20251030-120000.sql
```

**Requiere:**
- Archivo de backup válido
- Variable `DATABASE_URL` configurada
- `psql` instalado

**⚠️ Advertencia:**
- Sobrescribe base de datos actual
- Hacer backup antes de restore
- Detener servicio durante restore

**Cuándo usar:**
- Después de error en producción
- Rollback de datos
- Migración de servidor

---

### `scripts/cache-diagnostics.sh`
**Propósito:** Diagnosticar problemas de cache Docker/Next.js

**Verificaciones:**
- ✅ Cache de Docker layers
- ✅ Cache de Next.js (.next/)
- ✅ node_modules vs Prisma Client
- ✅ Yarn cache

**Uso:**
```bash
bash scripts/cache-diagnostics.sh
```

**Acciones recomendadas:**
```bash
# Limpiar cache Next.js
rm -rf app/.next

# Limpiar cache Yarn
yarn cache clean

# Build Docker sin cache
docker build --no-cache -t miapp .
```

**Cuándo usar:**
- Errores de módulos no encontrados
- Build inconsistente
- Después de cambios en dependencies

---

### `scripts/diagnose-db.sh`
**Propósito:** Diagnosticar problemas de base de datos

**Verificaciones:**
- ✅ Conectividad a PostgreSQL
- ✅ Estado de migraciones
- ✅ Tablas existentes
- ✅ Indices
- ✅ Permisos

**Uso:**
```bash
bash scripts/diagnose-db.sh
```

**Salida:**
```
✅ Conexión a BD: OK
✅ Migraciones aplicadas: 5
⚠️  Pending migrations: 1
✅ Tablas: 12
```

**Cuándo usar:**
- Errores de conexión a BD
- Problemas con migraciones
- Debugging de queries

---

## 📦 Scripts de Git

### `scripts/push-github.sh`
**Propósito:** Push seguro a GitHub con validaciones

**Características:**
- ✅ Ejecuta pre-push-check
- ✅ Verifica que no hay cambios sin commit
- ✅ Push con feedback visual
- ✅ Verifica que push fue exitoso

**Uso:**
```bash
bash scripts/push-github.sh
```

**Flujo:**
1. Verificar cambios pendientes
2. Ejecutar validaciones
3. Push a origin main
4. Confirmar éxito

**Cuándo usar:**
- En lugar de `git push` manual
- Integrado en workflow

---

### `scripts/setup-git-hooks.sh`
**Propósito:** Configurar Git hooks automáticos

**Hooks configurados:**
- `pre-commit` - Validaciones antes de commit
- `pre-push` - Validaciones antes de push

**Uso:**
```bash
bash scripts/setup-git-hooks.sh
```

**Pre-commit hook:**
- Valida formato de código
- Ejecuta linter
- Verifica que no hay console.log

**Pre-push hook:**
- Ejecuta pre-push-check.sh
- Valida que tests pasan

**Cuándo usar:**
- Setup inicial del proyecto
- Onboarding de nuevos developers

---

## 🛠️ Scripts Auxiliares

### `generar-secretos.js`
**Propósito:** Generar secrets seguros para NextAuth/JWT

**Uso:**
```bash
node generar-secretos.js
```

**Salida:**
```
NEXTAUTH_SECRET=generated_secret_here
JWT_SECRET=generated_secret_here
```

**Cuándo usar:**
- Setup inicial
- Rotación de secrets
- Después de security breach

---

## 📊 Resumen de Uso por Fase

### Setup Inicial
```bash
1. bash scripts/setup-git-hooks.sh
2. node generar-secretos.js
3. bash scripts/pre-build-check.sh
```

### Antes de Deployment
```bash
1. bash scripts/pre-deploy-check.sh
2. bash scripts/validate-absolute-paths.sh
3. bash backup-db.sh
```

### Durante Deployment
```bash
1. bash start-improved.sh
2. bash healthcheck.sh
```

### Debugging
```bash
1. bash scripts/cache-diagnostics.sh
2. bash scripts/diagnose-db.sh
3. bash healthcheck.sh
```

### Emergencia
```bash
1. bash emergency-start.sh
2. bash restore-db.sh backup-file.sql
```

---

## ✅ Checklist de Scripts

- [ ] Todos los scripts tienen permisos de ejecución
- [ ] Variables de entorno configuradas
- [ ] Git hooks configurados
- [ ] Backup automático programado
- [ ] Scripts de validación integrados en CI/CD

---

**Documentación actualizada:** Octubre 2025  
**Versión de plantilla:** 1.0.0
