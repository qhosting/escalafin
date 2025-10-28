
# 🚀 Guía de Despliegue en EasyPanel - EscalaFin MVP

## 📋 Requisitos Previos

- Servidor con EasyPanel instalado
- Dominio configurado (ej: `app.escalafin.com`)
- Repositorio en GitHub: `https://github.com/qhosting/escalafin`
- Base de datos PostgreSQL (puede ser creada en EasyPanel)

## 🔧 Paso 1: Preparar el Repositorio en GitHub

### 1.1 Verificar que el código esté actualizado

```bash
cd /home/ubuntu/escalafin_mvp
git status
git add .
git commit -m "Optimizado para EasyPanel"
git push origin main
```

## 🎯 Paso 2: Crear el Proyecto en EasyPanel

### 2.1 Acceder a EasyPanel

1. Abre tu navegador y accede a EasyPanel
2. Inicia sesión con tus credenciales

### 2.2 Crear Base de Datos PostgreSQL

1. Click en **"Create Service"**
2. Selecciona **"Database"**
3. Elige **"PostgreSQL"**
4. Configuración:
   - **Name**: `escalafin-db`
   - **PostgreSQL Version**: `16`
   - **Username**: `escalafin`
   - **Password**: (genera una contraseña segura)
   - **Database Name**: `escalafin_mvp`

5. Click en **"Create"**
6. **IMPORTANTE**: Guarda la URL de conexión que aparecerá:
   ```
   postgresql://escalafin:TU_PASSWORD@escalafin-db:5432/escalafin_mvp
   ```

### 2.3 Crear la Aplicación Next.js

1. Click en **"Create Service"**
2. Selecciona **"Application"**
3. Elige **"From GitHub"**
4. Configuración Básica:
   - **Repository**: `qhosting/escalafin`
   - **Branch**: `main`
   - **Build Method**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.easypanel`
   - **Port**: `3000`
   - **Service Name**: `escalafin-app`

### 2.4 Configurar Variables de Entorno

En la sección **Environment Variables**, agrega:

#### 🔐 Base de Datos
```bash
DATABASE_URL=postgresql://escalafin:TU_PASSWORD@escalafin-db:5432/escalafin_mvp
```

#### 🔑 Autenticación (NextAuth)
```bash
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=genera-un-secret-seguro-aqui
```

Para generar `NEXTAUTH_SECRET`, ejecuta en tu terminal local:
```bash
openssl rand -base64 32
```

#### ☁️ AWS S3 (Cloud Storage)
```bash
AWS_BUCKET_NAME=escalafin-uploads
AWS_FOLDER_PREFIX=escalafin/
AWS_REGION=us-east-1
```

**NOTA**: Las credenciales de AWS (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) 
ya están configuradas en el servidor y no necesitas agregarlas manualmente.

#### 💳 Openpay (Pagos)
```bash
OPENPAY_MERCHANT_ID=tu_merchant_id
OPENPAY_PRIVATE_KEY=tu_private_key
OPENPAY_PUBLIC_KEY=tu_public_key
OPENPAY_BASE_URL=https://sandbox-api.openpay.mx/v1
```

Para producción, cambia a:
```bash
OPENPAY_BASE_URL=https://api.openpay.mx/v1
```

#### 📱 Evolution API (WhatsApp)
```bash
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_API_TOKEN=tu_api_token
EVOLUTION_INSTANCE_NAME=escalafin
```

#### ⚙️ Next.js
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 2.5 Configurar Dominio

1. En la configuración de la aplicación, ve a **Domains**
2. Click en **"Add Domain"**
3. Ingresa tu dominio: `app.escalafin.com`
4. EasyPanel generará automáticamente el certificado SSL

### 2.6 Deploy Inicial

1. Click en **"Deploy"**
2. EasyPanel comenzará a:
   - Clonar el repositorio
   - Construir la imagen Docker
   - Ejecutar el contenedor
   - Configurar el dominio

3. Monitorea los logs en **"Logs"** para verificar que todo funcione correctamente

## 🔍 Paso 3: Verificar el Despliegue

### 3.1 Verificar Logs

En EasyPanel, ve a **Logs** y busca:

```
✅ Build de Next.js completado exitosamente
✅ Prisma Client generado
✅ Server started on port 3000
```

### 3.2 Verificar Acceso

1. Abre tu navegador
2. Accede a: `https://app.escalafin.com`
3. Deberías ver la página de inicio de EscalaFin

### 3.3 Verificar Health Check

Accede a: `https://app.escalafin.com/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "database": "connected"
}
```

## 🔄 Paso 4: Migraciones de Base de Datos

### 4.1 Ejecutar Migraciones Manualmente

Si necesitas ejecutar migraciones manualmente:

1. En EasyPanel, ve a tu aplicación
2. Click en **"Console"** o **"Shell"**
3. Ejecuta:

```bash
npx prisma migrate deploy
```

### 4.2 Ver Estado de la Base de Datos

```bash
npx prisma db pull
```

## 🛠️ Troubleshooting

### Problema 1: Error al construir la imagen

**Síntoma**: Build falla con "module not found"

**Solución**:
1. Verifica que `Dockerfile.easypanel` esté en la raíz del repositorio
2. Verifica que todas las dependencias estén en `package.json`
3. Re-deploy forzando rebuild

### Problema 2: Error de conexión a base de datos

**Síntoma**: "Can't reach database server"

**Solución**:
1. Verifica que la base de datos esté en **Running**
2. Verifica que `DATABASE_URL` tenga el formato correcto:
   ```
   postgresql://usuario:password@host:5432/database
   ```
3. El host debe ser el nombre interno del servicio (ej: `escalafin-db`)

### Problema 3: Errores 502 o 503

**Síntoma**: La aplicación no responde

**Solución**:
1. Verifica los logs en EasyPanel
2. Verifica que el puerto sea `3000`
3. Verifica que las variables de entorno estén configuradas correctamente

### Problema 4: Certificado SSL no funciona

**Síntoma**: "Connection not secure"

**Solución**:
1. Verifica que el dominio esté correctamente apuntado a tu servidor
2. Espera unos minutos (la emisión de certificado puede tardar)
3. En EasyPanel, ve a Domains y click en **"Refresh Certificate"**

## 📝 Comandos Útiles

### Ver logs en tiempo real
```bash
# En la consola de EasyPanel
tail -f /var/log/app.log
```

### Reiniciar la aplicación
En EasyPanel: Click en **"Restart"**

### Forzar rebuild
En EasyPanel: Click en **"Deploy"** → Check **"Force Rebuild"**

## 🔐 Seguridad

### Cambiar Secrets Regularmente

Cada 3 meses, regenera:
- `NEXTAUTH_SECRET`
- Passwords de base de datos

### Backups de Base de Datos

En EasyPanel, configura backups automáticos:
1. Ve a la base de datos
2. Click en **"Backups"**
3. Configura **"Auto Backup"** → Daily

## 📊 Monitoreo

### Métricas a Vigilar

- **CPU Usage**: Debe estar < 70%
- **Memory Usage**: Debe estar < 80%
- **Response Time**: < 500ms
- **Error Rate**: < 1%

### Configurar Alertas

En EasyPanel:
1. Ve a **Settings** → **Notifications**
2. Configura alertas para:
   - High CPU usage
   - High memory usage
   - Application down

## 🚀 Actualizaciones

### Deploy de Nuevos Cambios

1. Haz push a GitHub:
   ```bash
   git add .
   git commit -m "Nuevas funcionalidades"
   git push origin main
   ```

2. En EasyPanel, click en **"Deploy"**

EasyPanel automáticamente:
- Descargará los cambios
- Reconstruirá la imagen
- Desplegará la nueva versión

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en EasyPanel
2. Verifica la configuración de variables de entorno
3. Consulta esta guía nuevamente
4. Contacta al equipo de soporte

---

**✅ ¡Listo! Tu aplicación EscalaFin MVP está desplegada en EasyPanel.**

Accede a: `https://app.escalafin.com`
