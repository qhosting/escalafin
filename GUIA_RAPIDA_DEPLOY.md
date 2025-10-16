
# ⚡ Guía Rápida: Deploy en EasyPanel (1 Página)

## 🎯 3 Pasos para Deploy Exitoso

### 1️⃣ PRE-DEPLOY (2 minutos)
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/pre-deploy-check.sh
```
**Debe mostrar:** `✅ PRE-DEPLOY CHECK EXITOSO`

---

### 2️⃣ DEPLOY EN EASYPANEL (5-10 minutos)

#### A. Variables de Entorno (En EasyPanel > Settings > Environment)

**OBLIGATORIAS:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
NODE_ENV=production
```

**RECOMENDADAS:**
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=...
OPENPAY_MERCHANT_ID=...
OPENPAY_PRIVATE_KEY=...
OPENPAY_PUBLIC_KEY=...
```

#### B. Deploy
1. Click **"Deploy"** en EasyPanel
2. **Monitorea logs** - Busca:
   - ✅ `Installing dependencies`
   - ✅ `Generating Prisma Client`
   - ✅ `Building Next.js`
   - ✅ `Container started`
   - ✅ `Server started on port 3000`

---

### 3️⃣ POST-DEPLOY (1 minuto)
```bash
./scripts/post-deploy-check.sh https://tu-dominio.com
```
**Debe mostrar:** `✅ POST-DEPLOY CHECK EXITOSO`

---

## 🚨 Si Algo Sale Mal

### Error: npm ci lockfileVersion
**Solución:** Dockerfile v16.0 ya lo resuelve. Verifica que uses la versión correcta.

### Error: Cannot find module
**Solución:** Asegúrate que `node_modules` esté en `.dockerignore` ✅

### Error: Database connection
**Solución:** Verifica `DATABASE_URL` en EasyPanel

### Error: NEXTAUTH_SECRET
**Solución:** Genera con `openssl rand -base64 32` y configura

### Deploy falló completamente
**Solución Rápida:**
```bash
./scripts/emergency-rollback.sh
```

---

## ✅ Indicadores de Éxito

| Check | Estado Esperado |
|-------|----------------|
| Container | 🟢 Running |
| URL | Carga en < 2s |
| Login | ✅ Funciona |
| Logs | Sin errores |

---

## 📚 Documentación Completa

- **ESTRATEGIA_DEPLOY_EASYPANEL.md** - Estrategia completa
- **CHECKLIST_DEPLOY_EASYPANEL.md** - Checklist detallado
- **FIX_NPM_CI_LOCKFILEVERSION.md** - Fix npm ci
- **scripts/README.md** - Documentación scripts

---

## 🎯 Comando Rápido

```bash
# Todo en uno:
cd /home/ubuntu/escalafin_mvp && \
./scripts/pre-deploy-check.sh && \
echo "✅ Listo para deploy en EasyPanel"
```

---

**¡Deploy EscalaFin MVP en 3 pasos! 🚀**
