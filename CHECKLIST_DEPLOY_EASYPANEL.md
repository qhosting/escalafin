
# ✅ Checklist de Deploy - EasyPanel

**Guía rápida de verificación para deploy en EasyPanel**

---

## 🎯 Antes de Hacer Deploy

### 1️⃣ Ejecutar Pre-Deploy Check
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/pre-deploy-check.sh
```

**Espera ver:** `✅ PRE-DEPLOY CHECK EXITOSO`

---

### 2️⃣ Verificar Archivos Críticos

- [ ] `Dockerfile` existe (v16.0+)
- [ ] `app/package.json` existe
- [ ] `app/package-lock.json` existe
- [ ] `app/next.config.js` tiene `output: 'standalone'`
- [ ] `app/prisma/schema.prisma` existe
- [ ] `.dockerignore` existe
- [ ] `start.sh` y `healthcheck.sh` existen y son ejecutables

---

### 3️⃣ Configurar Variables de Entorno en EasyPanel

#### Variables OBLIGATORIAS ⭐⭐⭐⭐⭐

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=<genera-con-openssl-rand-base64-32>
NODE_ENV=production
```

#### Variables RECOMENDADAS ⭐⭐⭐⭐

```bash
# AWS S3
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=tu_bucket
AWS_FOLDER_PREFIX=escalafin/

# Openpay
OPENPAY_MERCHANT_ID=tu_merchant_id
OPENPAY_PRIVATE_KEY=tu_private_key
OPENPAY_PUBLIC_KEY=tu_public_key
OPENPAY_API_ENDPOINT=https://api.openpay.mx/v1
OPENPAY_IS_PRODUCTION=true

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_API_KEY=tu_api_key
EVOLUTION_INSTANCE_NAME=tu_instancia

# Configuración
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
SKIP_ENV_VALIDATION=false
```

---

### 4️⃣ Verificar Git

```bash
# Ver estado
git status

# Si hay cambios sin commitear
git add .
git commit -m "feat: preparado para deploy en EasyPanel"
git push origin main
```

---

## 🚀 Durante el Deploy

### En EasyPanel:

1. **Ve a tu aplicación**
2. **Click en "Deploy"** o "Redeploy"
3. **Monitorea los logs en tiempo real**
4. **Busca estos mensajes:**
   - ✅ `Installing dependencies`
   - ✅ `Generating Prisma Client`
   - ✅ `Building Next.js`
   - ✅ `Standalone build generated`
   - ✅ `Container started`
   - ✅ `Server started on port 3000`

### ⚠️ Si ves errores:

- **"npm ci: lockfileVersion not supported"**
  → Asegúrate de usar Dockerfile v16.0+

- **"Cannot find module"**
  → Verifica que `node_modules` esté en `.dockerignore`

- **"Prisma Client not generated"**
  → Verifica que el Dockerfile tenga `npx prisma generate`

- **"Database connection failed"**
  → Verifica `DATABASE_URL` en variables de entorno

---

## ✅ Después del Deploy

### 1️⃣ Verificar que el Container Está Corriendo

**En EasyPanel:**
- Status debe ser: 🟢 Running

---

### 2️⃣ Ejecutar Post-Deploy Check

```bash
cd /home/ubuntu/escalafin_mvp
./scripts/post-deploy-check.sh https://tu-dominio.com
```

**Espera ver:** `✅ POST-DEPLOY CHECK EXITOSO`

---

### 3️⃣ Verificaciones Manuales

#### Inmediato (0-5 minutos):

- [ ] Abrir URL principal: `https://tu-dominio.com`
- [ ] Página carga sin errores
- [ ] Página de login se muestra correctamente
- [ ] No hay errores en la consola del navegador

#### 30 minutos después:

- [ ] Login funciona con usuario de prueba
- [ ] Dashboard carga datos correctamente
- [ ] Navegación entre páginas funciona
- [ ] File uploads funcionan (si aplica)

#### 24 horas después:

- [ ] No hay memory leaks en EasyPanel > Metrics
- [ ] No hay errores recurrentes en logs
- [ ] Performance es aceptable (< 2s respuesta)

---

### 4️⃣ Revisar Logs en EasyPanel

**Ve a:** Logs > Real-time logs

**Busca:**
- ✅ `Server started on port 3000`
- ✅ `Database connected`
- ✅ `NextAuth initialized`

**NO debe haber:**
- ❌ `Error: Cannot connect to database`
- ❌ `FATAL`
- ❌ `UnhandledPromiseRejection`

---

## 🚨 En Caso de Error

### Opción 1: Revisar Logs y Fix Rápido

```bash
# En EasyPanel:
# 1. Ve a Logs
# 2. Identifica el error
# 3. Consulta "Estrategia de Errores" en:
#    ESTRATEGIA_DEPLOY_EASYPANEL.md
# 4. Aplica el fix
# 5. Redeploy
```

---

### Opción 2: Rollback Rápido en EasyPanel

```bash
# En EasyPanel:
# 1. Ve a Deployments
# 2. Encuentra el último deployment exitoso
# 3. Click en "Redeploy"
```

---

### Opción 3: Rollback por Git

```bash
cd /home/ubuntu/escalafin_mvp

# Ver commits recientes
git log --oneline -10

# Revertir al commit anterior estable
git revert <commit-hash>
git push origin main

# Redeploy en EasyPanel
```

---

### Opción 4: Emergency Rollback

```bash
cd /home/ubuntu/escalafin_mvp
./scripts/emergency-rollback.sh
```

---

## 📊 Indicadores de Deploy Exitoso

### ✅ Todo está bien si:

- 🟢 Container status: Running
- ✅ Health check: Passing
- ✅ URL carga en < 2 segundos
- ✅ Login funciona
- ✅ No hay errores en logs
- ✅ Memoria estable en métricas
- ✅ CPU < 80% en promedio

---

### ⚠️ Revisa si:

- 🟡 URL carga en > 5 segundos
- ⚠️ Hay warnings en logs
- ⚠️ Memoria crece constantemente
- ⚠️ CPU > 90% constantemente

---

### ❌ Rollback inmediato si:

- 🔴 Container status: Crashed / Restarting
- ❌ URL no carga (timeout)
- ❌ Errores críticos en logs
- ❌ Login no funciona
- ❌ Database connection failed

---

## 📚 Documentación de Referencia

1. **ESTRATEGIA_DEPLOY_EASYPANEL.md** - Estrategia completa
2. **FIX_NPM_CI_LOCKFILEVERSION.md** - Fix error npm ci
3. **MULTI_INSTANCE_GUIDE.md** - Deploy multi-instancia
4. **EASYPANEL_DOCKER_GUIDE.md** - Guía Docker en EasyPanel

---

## 🎯 Resumen en 3 Pasos

### 1. PRE-DEPLOY
```bash
./scripts/pre-deploy-check.sh
# ✅ Debe pasar sin errores
```

### 2. DEPLOY
- Configura variables en EasyPanel
- Click en "Deploy"
- Monitorea logs

### 3. POST-DEPLOY
```bash
./scripts/post-deploy-check.sh https://tu-dominio.com
# ✅ Debe pasar sin errores
```

---

## ✅ ¡Listo!

Si todo está ✅, tu aplicación está corriendo correctamente en producción.

**Accede a:** `https://tu-dominio.com`

---

**Última actualización:** 16 de octubre de 2025  
**Versión:** 1.0
