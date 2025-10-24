
# 🔍 DIAGNÓSTICO: Deploy exitoso pero página no se visualiza

## 📋 Situación Actual

✅ **Configuración correcta detectada:**
- Ruta de compilación: `/`
- Método: Dockerfile
- Variables de entorno: Configuradas

❌ **Problema:**
- Build se completa sin errores
- Container se inicia
- Pero la página NO se visualiza

## 🚨 PROBLEMAS IDENTIFICADOS EN TUS VARIABLES

### 1. DATABASE_URL - CRÍTICO ⚠️

```bash
DATABASE_URL=postgresql://postgres:fa8853b6e623ed411e27@cloudmx_escalafin-db:5432/escalafin-db?schema=public
```

**PROBLEMA:** El host `cloudmx_escalafin-db` es un nombre de servicio Docker interno.

**¿Funciona?** SOLO si tienes un servicio de PostgreSQL llamado exactamente `cloudmx_escalafin-db` en la misma red Docker de EasyPanel.

**Soluciones:**

**Opción A:** Si tienes PostgreSQL en EasyPanel:
- Ve a tu servicio de PostgreSQL en EasyPanel
- Copia la "Connection URL" o "Internal URL"
- Debe verse algo así: `postgresql://user:pass@escalafin-db:5432/dbname`

**Opción B:** Si usas base de datos externa (Railway, Render, Supabase):
- Usa la URL externa/pública
- Ejemplo Railway: `postgresql://postgres:pass@containers-us-west-xx.railway.app:5432/railway`
- Ejemplo Supabase: `postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres`

### 2. NEXTAUTH_URL - CRÍTICO ⚠️

```bash
NEXTAUTH_URL=https://escalafin.com
```

**PROBLEMA:** La URL configurada es `escalafin.com` pero tu app en EasyPanel está en otra URL.

**¿Qué URL es?** Probablemente algo como:
- `https://escalafin-xxxxx.easypanel.host`
- O un dominio custom que configuraste

**SOLUCIÓN:** Cambia a la URL REAL donde está desplegada la app.

### 3. AWS Keys - NO CRÍTICO pero Problemático ⚠️

```bash
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
```

**PROBLEMA:** Estas son credenciales placeholder (ficticias).

**¿Es crítico?** Depende:
- Si la app intenta acceder a S3 al iniciar → FALLA
- Si S3 solo se usa para uploads después → No crítico ahora

**SOLUCIÓN TEMPORAL:** Puedes dejar valores dummy SI no planeas usar uploads de archivos inmediatamente.

## 🔍 DIAGNÓSTICO PASO A PASO

### Paso 1: Verificar los Logs

En EasyPanel, ve a tu aplicación y busca la sección **Logs** o **Container Logs**.

#### ✅ Si el container está iniciando correctamente, verás:

```
🚀 Iniciando ESCALAFIN...
📦 PATH configurado
🔄 Aplicando migraciones si es necesario...
✅ Migraciones aplicadas correctamente
✅ server.js encontrado en /app/server.js
🚀 Iniciando servidor Next.js standalone...
🎉 EJECUTANDO: node server.js
```

#### ❌ Si hay error de base de datos, verás:

```
Error: P1001: Can't reach database server at `cloudmx_escalafin-db:5432`
```

**Solución:** Corregir DATABASE_URL

#### ❌ Si hay error de NextAuth, verás:

```
Error: Please define NEXTAUTH_URL
```
o
```
Error: [next-auth][error][INVALID_URL]
```

**Solución:** Corregir NEXTAUTH_URL

#### ❌ Si hay error de módulos, verás:

```
Error: Cannot find module 'next/dist/server/next-server'
```

**Solución:** Clear cache y rebuild

### Paso 2: Verificar Health Check

Abre en tu navegador:
```
https://TU-URL-EASYPANEL.easypanel.host/api/health
```

#### ✅ Si funciona, verás:
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T...",
  "uptime": 123.45
}
```

#### ❌ Si NO funciona:
- 404 Not Found → El routing no está funcionando
- 502 Bad Gateway → El container no está respondiendo
- Connection timeout → El container no está corriendo

### Paso 3: Verificar Estado del Container

En EasyPanel, busca el estado del container:

- ✅ **Running/Healthy** → Container OK, problema es de routing/configuración
- ❌ **Unhealthy** → Container tiene problemas internos
- ❌ **CrashLoopBackOff** → Container se inicia y muere constantemente

## 🎯 SOLUCIONES INMEDIATAS

### Solución 1: Corregir DATABASE_URL

**Si tienes PostgreSQL en EasyPanel:**

1. Ve a tu servicio de PostgreSQL en EasyPanel
2. Busca "Connection String" o "Internal URL"
3. Copia esa URL
4. Actualiza la variable DATABASE_URL con esa URL

**Si usas base de datos externa:**

1. Ve a tu proveedor (Railway, Supabase, Render, etc.)
2. Copia la Connection URL pública
3. Asegúrate de que incluye `?schema=public` al final si es necesario
4. Actualiza DATABASE_URL

**Ejemplo para Railway:**
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway?schema=public
```

**Ejemplo para Supabase:**
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxyyyzzz.supabase.co:5432/postgres?schema=public
```

### Solución 2: Corregir NEXTAUTH_URL

**Encuentra tu URL en EasyPanel:**

1. Ve a tu aplicación en EasyPanel
2. Busca la sección "Domain" o "URL"
3. Copia la URL completa (ejemplo: `https://escalafin-abc123.easypanel.host`)
4. Actualiza NEXTAUTH_URL:

```bash
NEXTAUTH_URL=https://escalafin-abc123.easypanel.host
```

**IMPORTANTE:** La URL debe ser exacta, incluyendo `https://`

### Solución 3: AWS Keys (Opcional por ahora)

Si no planeas usar file uploads inmediatamente:

```bash
# Deja valores dummy por ahora
AWS_ACCESS_KEY_ID=DUMMY_KEY_FOR_NOW
AWS_SECRET_ACCESS_KEY=DUMMY_SECRET_FOR_NOW
AWS_REGION=us-east-1
AWS_BUCKET_NAME=escalafin-uploads
```

La app iniciará sin error porque S3 solo se usa cuando subes archivos.

## 🔄 Pasos para Aplicar las Correcciones

1. **Ir a EasyPanel** → Tu aplicación
2. **Settings** → **Environment Variables**
3. **Editar las 2-3 variables problemáticas:**
   - DATABASE_URL (con la URL correcta)
   - NEXTAUTH_URL (con la URL real de EasyPanel)
   - AWS keys (opcional, puedes dejarlo para después)
4. **Guardar** los cambios
5. **Restart** la aplicación (NO necesitas rebuild, solo restart)
6. **Esperar 30 segundos** para que reinicie
7. **Abrir tu URL** en el navegador

## 📞 Información que Necesito

Para ayudarte más específicamente, necesito:

1. **Screenshot de los LOGS del container** (completos, desde el inicio)
2. **La URL exacta** donde está desplegada la app en EasyPanel
3. **¿Dónde está tu base de datos?**
   - En EasyPanel (mismo proyecto)
   - Railway
   - Supabase
   - Render
   - Otro proveedor

## 🎯 Resumen Ultra-Corto

**Problema más probable:** DATABASE_URL o NEXTAUTH_URL incorrectas

**Solución:**
1. Corregir DATABASE_URL con la URL real de tu PostgreSQL
2. Corregir NEXTAUTH_URL con la URL real de EasyPanel
3. Restart (no rebuild)
4. Probar

---

**Próximo paso:** Por favor comparte los logs del container para diagnóstico preciso.
