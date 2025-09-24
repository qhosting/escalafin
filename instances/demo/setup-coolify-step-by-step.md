
# 🚀 Despliegue EscalaFin en Coolify - Paso a Paso

## ✅ PASO 1: Configuración Inicial (COMPLETADO)
- Variables de entorno generadas automáticamente ✅
- Archivos Docker preparados ✅
- Scripts de despliegue listos ✅

## 🎯 PASO 2: Acceder a Coolify

1. Abre tu navegador y ve a: **https://adm.escalafin.com**
2. Inicia sesión con tus credenciales de Coolify

## 📋 PASO 3: Crear Proyecto

En la interfaz de Coolify:

1. Clic en **"+ New Resource"**
2. Selecciona **"Service"**
3. Choose **"Docker Compose"**
4. Configurar:
   - **Name:** `escalafin-mvp`
   - **Description:** `Sistema de Gestión de Créditos EscalaFin`

## 🔗 PASO 4: Conectar Repositorio

1. **Source Type:** GitHub
2. **Repository:** Tu repositorio (ej: `tu-usuario/escalafin-mvp`)
3. **Branch:** `main` o `master`
4. **Docker Compose File:** `docker-compose.coolify.yml`
5. **Auto Deploy:** ✅ Enabled

## 🌐 PASO 5: Configurar Dominio

1. En tu proyecto, ve a **"Domains"**
2. Clic en **"+ Add Domain"**
3. Añade:
   - `escalafin.com` (Primary)
   - `www.escalafin.com` (Alias)
4. **SSL:** Auto (Let's Encrypt) ✅

## 🔧 PASO 6: Variables de Entorno

1. Ve a **"Environment Variables"**
2. Clic en **"Bulk Edit"**
3. Copia el contenido del archivo `.env.production`:

```env
NODE_ENV=production
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=7Vl9Ey7W7etMb2vlFqd6uLDSC+eQPLO3hhnep522cVY=
DATABASE_URL=postgresql://escalafin:KLzxZk4aPpucI4OZwQMOCg==@db:5432/escalafin
POSTGRES_USER=escalafin
POSTGRES_PASSWORD=KLzxZk4aPpucI4OZwQMOCg==
POSTGRES_DB=escalafin
REDIS_PASSWORD=O0gQyNnTqCWYR0mJodnhMg==

# ⚠️ DEJAR VACÍO POR AHORA (configurarás después):
OPENPAY_MERCHANT_ID=
OPENPAY_PRIVATE_KEY=
OPENPAY_PUBLIC_KEY=
OPENPAY_BASE_URL=https://api.openpay.mx/v1

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=escalafin/

EVOLUTION_API_URL=
EVOLUTION_API_TOKEN=
EVOLUTION_INSTANCE_NAME=escalafin
```

4. Clic en **"Save"**

## 🚀 PASO 7: Deploy

1. Ve a la pestaña **"Deployments"**
2. Clic en **"Deploy"**
3. Espera a que termine el proceso (2-5 minutos)

## ✅ PASO 8: Verificar

Una vez completado el despliegue:

1. **URL Principal:** https://escalafin.com
2. **Health Check:** https://escalafin.com/api/health
3. **Admin Panel:** https://escalafin.com/admin

### Credenciales de prueba:
- **Admin:** `admin@escalafin.com` / `admin123`
- **Asesor:** `asesor1@escalafin.com` / `asesor123`

## 🔄 PASO 9: Configurar Auto-Deploy (Opcional)

1. En **"Settings"**
2. **Auto Deploy:** ✅ Enabled
3. **Watch Paths:** `app/**, docker-compose.coolify.yml, Dockerfile.coolify`

---

## 🆘 Si algo sale mal:

### Ver Logs:
En Coolify → Tu proyecto → **"Logs"**

### Restart Services:
En Coolify → Tu proyecto → **"Actions"** → **"Restart"**

### Contacto:
- Revisa `COOLIFY_DEPLOYMENT_GUIDE.md` para solución de problemas
- Usa el script: `./deploy-coolify.sh logs`

---

## 📞 ¿Necesitas ayuda?

**Déjame saber:**
- ¿En qué paso estás?
- ¿Algún error específico?
- ¿Necesitas ayuda con alguna configuración?

**¡Tu aplicación estará lista en menos de 10 minutos!** 🎉
