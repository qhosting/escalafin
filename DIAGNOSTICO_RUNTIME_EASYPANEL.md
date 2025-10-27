
# 🔍 DIAGNÓSTICO - Página Principal No Se Visualiza

## 📋 INFORMACIÓN ACTUAL

**Variables de entorno configuradas:**
```
DATABASE_URL=postgresql://postgres:***@cloudmx_escalafin-db:5432/escalafin-db?schema=public
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=***
JWT_SECRET=***
NODE_ENV=production
PORT=3000
```

**Estado:**
- ✅ Build completado sin errores
- ✅ DNS y dominio configurados
- ✅ Variables de entorno configuradas
- ❌ Página principal no se visualiza

---

## 🎯 POSIBLES CAUSAS Y SOLUCIONES

### 1. 🔌 PUERTO NO EXPUESTO EN EASYPANEL

**Problema:** EasyPanel no está mapeando el puerto 3000 del contenedor correctamente.

**Solución:**

1. Ve a tu servicio en EasyPanel
2. Busca la sección **"Ports"** o **"Network"**
3. Verifica que esté configurado así:

   ```
   Container Port: 3000
   Public Port: 80 (o el que asigne EasyPanel)
   Protocol: HTTP
   ```

4. Si no existe, agrégalo:
   - Click en **"Add Port"**
   - Container Port: `3000`
   - Protocol: `HTTP`
   - Public: `Yes` o marca el checkbox

5. **Guarda** y **Rebuild**

---

### 2. 📊 REVISAR LOGS DE RUNTIME

**Necesitamos ver los logs de la aplicación en ejecución, NO los logs de build.**

**En EasyPanel:**

1. Ve a tu servicio
2. Pestaña **"Logs"** (asegúrate de no estar en "Build Logs")
3. Busca mensajes como:

   **✅ Si funciona correctamente:**
   ```
   🚀 Iniciando ESCALAFIN...
   📦 PATH configurado: ...
   🔄 Aplicando migraciones si es necesario...
   ✅ Base de datos ya tiene usuarios, omitiendo seed
   🔍 Verificando archivos de Next.js standalone...
   ✅ server.js encontrado en /app/server.js (CORRECTO)
   🚀 Iniciando servidor Next.js standalone...
   🎉 EJECUTANDO: node server.js
   ```

   Seguido de:
   ```
   ▲ Next.js 14.x.x
   - Local:        http://0.0.0.0:3000
   - Network:      http://0.0.0.0:3000
   
   ✓ Ready in XXXms
   ```

   **❌ Si hay un error:**
   - Copia el error completo y compártelo

---

### 3. ❤️ VERIFICAR HEALTH CHECK

**En EasyPanel:**

1. Ve a tu servicio
2. Busca el **estado del health check** (círculo verde/rojo)

**Si está rojo:**
- El contenedor está funcionando pero la app no responde
- Problema más probable: puerto incorrecto o app no inició

**Configuración correcta del health check:**
```
Type: HTTP
Path: /api/health
Port: 3000
Interval: 30s
Timeout: 10s
```

Si no tienes health check configurado:
1. Settings → Health Check
2. Agrega el health check con los valores de arriba
3. Save y espera 30 segundos

---

### 4. 🌐 VERIFICAR DOMINIO Y DNS

**Verifica que el dominio apunte correctamente:**

```bash
# Desde tu servidor o terminal local
nslookup escalafin.com
```

Debe resolver a la IP de tu servidor EasyPanel.

**En EasyPanel:**
1. Ve a **Domains**
2. Verifica que `escalafin.com` esté listado
3. Estado debe ser **"Active"** (verde)
4. Si usas HTTPS, verifica que el certificado SSL esté **"Valid"**

---

### 5. 🔍 VERIFICACIÓN DIRECTA POR IP

**Para descartar problemas de DNS/dominio:**

1. En EasyPanel, encuentra la **IP pública** del servidor
2. Intenta acceder directamente:
   ```
   http://[IP]:3000
   ```
   (reemplaza [IP] con la IP real)

**Si funciona por IP pero no por dominio:**
- Problema de DNS/dominio
- Verifica configuración de dominio en EasyPanel

**Si NO funciona por IP:**
- El servicio no está iniciando correctamente
- Revisa logs de runtime (Paso 2)

---

### 6. 🐛 VERIFICAR SI LA APP ESTÁ CORRIENDO

**En EasyPanel, ejecuta estos comandos en el contenedor:**

Ve a **Console** o **Shell** y ejecuta:

```bash
# 1. Verificar que el proceso esté corriendo
ps aux | grep node

# 2. Verificar que esté escuchando en el puerto 3000
netstat -tlnp | grep 3000
# O si no está netstat:
ss -tlnp | grep 3000

# 3. Probar desde dentro del contenedor
wget -O- http://localhost:3000 2>&1 | head -20
```

**Resultados esperados:**

```bash
# 1. ps aux
nextjs     1  node server.js   # ✅ Proceso corriendo

# 2. netstat/ss
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  1/node  # ✅ Escuchando

# 3. wget
<!DOCTYPE html>...  # ✅ Responde HTML
```

---

### 7. 🔧 CONFIGURACIÓN FALTANTE EN EASYPANEL

**Variables de entorno que podrían faltar:**

En EasyPanel, agrega estas variables si no las tienes:

```
HOSTNAME=0.0.0.0
PORT=3000
```

Nota: Ya las tienes configuradas en el Dockerfile, pero agrégalas también en EasyPanel por si acaso.

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

Sigue estos pasos en orden:

### ☑️ Paso 1: Revisar Logs de Runtime
- Ve a Logs (no Build Logs)
- Copia y comparte el output completo

### ☑️ Paso 2: Verificar Puerto Expuesto
- Settings → Ports
- Asegúrate de que 3000 esté expuesto

### ☑️ Paso 3: Verificar Health Check
- Debe estar en verde
- Si está rojo, revisa configuración

### ☑️ Paso 4: Acceso por IP
- Intenta `http://[IP]:3000`
- Confirma si funciona o no

### ☑️ Paso 5: Comandos en Consola
- Ejecuta los comandos del Paso 6
- Comparte los resultados

---

## 📸 CAPTURAS ÚTILES

Por favor, proporciona capturas de pantalla de:

1. **Estado del servicio** (verde/rojo)
2. **Logs de runtime** (últimas 50 líneas)
3. **Configuración de puertos** (Settings → Ports)
4. **Configuración de dominio** (Domains)
5. **Health check status**

---

## 🆘 SOLUCIÓN RÁPIDA SI TODO LO ANTERIOR FALLA

Si después de revisar todo lo anterior no funciona:

### Opción 1: Recrear el Servicio
1. **Exporta** las variables de entorno
2. **Elimina** el servicio actual
3. **Crea** un nuevo servicio desde GitHub
4. **Configura** puerto 3000 explícitamente
5. **Agrega** dominio

### Opción 2: Usar Docker Compose
En lugar de usar solo Dockerfile, usa el `docker-compose.yml` que incluye toda la configuración de puertos y networking.

---

## 📝 INFORMACIÓN PARA COMPARTIR

Para que pueda ayudarte mejor, comparte:

1. **Logs de runtime** (no build logs)
2. **Configuración de puerto en EasyPanel** (captura)
3. **Estado del health check** (verde/rojo)
4. **Resultado de acceso por IP** (funciona/no funciona)
5. **Output de comandos del Paso 6**

---

**Fecha:** 27 de octubre de 2025  
**Autor:** DeepAgent  
**Objetivo:** Diagnosticar y resolver problema de visualización
