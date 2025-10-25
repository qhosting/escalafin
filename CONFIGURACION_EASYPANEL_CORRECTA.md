
# ⚙️ CONFIGURACIÓN CORRECTA PARA EASYPANEL

## 📋 Configuración Actualizada (25 Oct 2025)

### 🔧 GitHub Integration

```yaml
Propietario: qhosting
Repositorio: escalafin-mvp
Rama: main
Ruta de compilación: /
```

### 🐋 Build Configuration

```yaml
Método: Dockerfile
Archivo: Dockerfile (en la raíz del proyecto)
Build Path: /
```

### 🌐 Variables de Entorno ACTUALIZADAS

**CRÍTICO:** Si usas el dominio `escalafin.com`, configura:

```bash
# Base de Datos
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/escalafin-db?schema=public

# NextAuth (USAR TU DOMINIO REAL)
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=8mK9nL0pQ1rS2tU3vW4xY5zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9
JWT_SECRET=5tU6vW7xY8zA9bC0dE1fG2hI3jK4lM5nO6pQ7rS8tU9vW0xY1zA2bC3dE4fG5hI6

# Node Environment
NODE_ENV=production
PORT=3000

# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://evo.whatscloud.site
EVOLUTION_API_TOKEN=AD95FBEE3AAA-492D-9E88-6E9F8EAE2E77
EVOLUTION_INSTANCE_NAME=escalafin_prod

# Openpay (Pagos)
OPENPAY_MERCHANT_ID=m5ag0krshs9byhjssp69
OPENPAY_PRIVATE_KEY=sk_6c14c7d6accf48fcaa8d7f13fe1e8ff9
OPENPAY_PUBLIC_KEY=pk_1572d7631ef94115901466d396af54d3
OPENPAY_BASE_URL=https://api.openpay.mx/v1
OPENPAY_CLIENT_ID=root@cloudmx.site

# AWS S3 (opcional por ahora)
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=escalafin-uploads
```

## 🌍 Configuración de Dominio Custom

### Paso 1: Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.):

```dns
Type: A
Name: @
Value: [IP de tu servidor EasyPanel]
TTL: Auto o 3600
```

**O si usas Cloudflare/proxy:**

```dns
Type: CNAME
Name: @
Value: [tu-app].easypanel.host
TTL: Auto
Proxy: Activado (nube naranja)
```

### Paso 2: Configurar Dominio en EasyPanel

1. Ve a tu aplicación en EasyPanel
2. **Settings** → **Domains**
3. Click en **Add Domain**
4. Ingresa: `escalafin.com`
5. Habilita **SSL/TLS** (Let's Encrypt)
6. **Save**

### Paso 3: Verificar Propagación DNS

```bash
# Desde terminal
dig escalafin.com A

# O desde navegador
https://dnschecker.org/#A/escalafin.com
```

Espera 5-30 minutos para propagación DNS.

## 🔒 SSL/TLS (HTTPS)

EasyPanel configura automáticamente SSL con Let's Encrypt:

- ✅ Certificado se genera automáticamente
- ✅ Renovación automática cada 90 días
- ✅ Redirección HTTP → HTTPS automática

**Verificar SSL:**
```bash
curl -I https://escalafin.com | grep -i "HTTP\|SSL"
```

## 💾 Configuración de Recursos

### Recomendado para Producción:

```yaml
Memory: 2GB (mínimo)
CPU: 1 core (mínimo)
Storage: 10GB (recomendado)
```

### Para Mayor Rendimiento:

```yaml
Memory: 4GB
CPU: 2 cores
Storage: 20GB
```

## 🔄 Proceso de Deploy

### Opción A: Auto-Deploy

1. Cada push a `main` en GitHub dispara deploy automático
2. EasyPanel detecta cambios
3. Build se ejecuta automáticamente
4. Deploy si build es exitoso

### Opción B: Manual Deploy

1. Ve a tu aplicación en EasyPanel
2. Click en **Deploy** o **Rebuild**
3. Selecciona "Force Rebuild" si necesitas limpiar cache
4. **Confirm**

## 📊 Verificación Post-Deploy

### 1. Verificar Build

Revisa los logs de build en EasyPanel:

```
✓ Building Docker image...
✓ Installing dependencies...
✓ Building Next.js app...
✓ Build successful
```

### 2. Verificar Runtime

Revisa los logs del container:

```
🚀 Iniciando ESCALAFIN...
✅ server.js encontrado
🎉 EJECUTANDO: node server.js
Ready! Next.js started on port 3000
```

### 3. Verificar Health Check

```bash
curl https://escalafin.com/api/health
```

Debería retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T...",
  "uptime": 123.45
}
```

### 4. Verificar Página Principal

Abre en navegador:
```
https://escalafin.com
```

Deberías ver la página de login de ESCALAFIN.

## 🐛 Troubleshooting

### Problema: Build falla con "yarn.lock not found"

**Solución:** ✅ YA RESUELTO (commit 2776a27)
- El symlink fue convertido a archivo real

### Problema: Página no se visualiza

**Causas comunes:**

1. **NEXTAUTH_URL incorrecta**
   - Verificar que sea exactamente `https://escalafin.com`
   - No debe tener `/` al final

2. **DNS no propagado**
   - Esperar 5-30 minutos
   - Verificar con `dig escalafin.com`

3. **SSL no configurado**
   - Verificar en EasyPanel → Domains
   - Debe mostrar "SSL: Active"

4. **DATABASE_URL incorrecta**
   - Verificar conectividad a PostgreSQL
   - Revisar logs del container

### Problema: Error 502 Bad Gateway

**Causa:** Container no está corriendo o crasheó

**Solución:**
1. Revisar logs del container
2. Verificar que `PORT=3000` está configurado
3. Verificar memoria asignada (mínimo 2GB)

### Problema: Error 404 en todas las páginas

**Causa:** Next.js no inició correctamente

**Solución:**
1. Verificar que `server.js` existe en el container
2. Revisar logs: `ls -la /app/server.js`
3. Force rebuild si es necesario

## 📝 Checklist Final

Antes de considerar el deploy exitoso:

- [ ] ✅ Build completado sin errores
- [ ] ✅ Container corriendo (status: Running)
- [ ] ✅ DNS apunta a servidor correcto
- [ ] ✅ SSL activo y válido
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ DATABASE_URL conecta correctamente
- [ ] ✅ NEXTAUTH_URL = `https://escalafin.com`
- [ ] ✅ Página principal carga
- [ ] ✅ Login funciona
- [ ] ✅ Health check responde OK

## 🆘 Soporte

Si después de seguir estos pasos sigue sin funcionar, necesito:

1. **Screenshot de los logs de build** (completo)
2. **Screenshot de los logs del container** (últimas 50 líneas)
3. **Resultado de:** `curl -I https://escalafin.com`
4. **Resultado de:** `dig escalafin.com A`

---

**Última actualización:** 25 de Octubre, 2025
**Commit actual:** 2776a27
**Estado:** ✅ Configuración completa y verificada
