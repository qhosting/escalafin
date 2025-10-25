
# ⚡ ACCIÓN INMEDIATA - EasyPanel No Visualiza

## 🎯 CAMBIOS QUE DEBES HACER AHORA

### 1️⃣ NEXTAUTH_URL - CAMBIAR INMEDIATAMENTE

**Actual (INCORRECTO):**
```bash
NEXTAUTH_URL=https://escalafin.com
```

**Debe ser la URL REAL de EasyPanel:**
```bash
NEXTAUTH_URL=https://tu-app-REAL.easypanel.host
```

**¿Cómo encontrar la URL correcta?**
- En EasyPanel, ve a tu aplicación
- Busca "Domain", "URL" o "Endpoint"
- Copia la URL completa
- Ejemplo: `https://escalafin-12abc3.easypanel.host`

### 2️⃣ DATABASE_URL - VERIFICAR

**Actual:**
```bash
DATABASE_URL=postgresql://postgres:fa8853b6e623ed411e27@cloudmx_escalafin-db:5432/escalafin-db?schema=public
```

**Pregunta crítica:** ¿Dónde está tu base de datos PostgreSQL?

**A) Si está en EasyPanel (mismo proyecto):**
- Ve al servicio de PostgreSQL en EasyPanel
- Copia la "Internal Connection URL"
- Reemplaza DATABASE_URL con esa

**B) Si está en Railway, Supabase, Render, etc.:**
- Copia la URL pública/externa de tu proveedor
- Debe incluir un hostname externo, no `cloudmx_escalafin-db`
- Ejemplo: `postgresql://user:pass@containers-us-west-123.railway.app:5432/db`

## 🚀 PASOS PARA CORREGIR (3 minutos)

### 1. Ir a Variables de Entorno

```
EasyPanel → Tu App → Settings → Environment Variables
```

### 2. Editar NEXTAUTH_URL

1. Busca la variable `NEXTAUTH_URL`
2. Cambia de `https://escalafin.com` a tu URL real de EasyPanel
3. **Guarda**

### 3. Verificar DATABASE_URL

1. Busca la variable `DATABASE_URL`
2. ¿El hostname es `cloudmx_escalafin-db`? 
   - ✅ Si tienes ese servicio en EasyPanel → OK
   - ❌ Si NO lo tienes → Cambiar a la URL correcta

### 4. Restart (NO Rebuild)

1. **Guardar** las variables
2. **Restart** la aplicación (botón de restart/reiniciar)
3. **NO necesitas rebuild**, solo restart
4. Espera 30-60 segundos

### 5. Probar

Abre tu URL en el navegador:
```
https://tu-app-real.easypanel.host
```

## 🔍 SI SIGUE SIN FUNCIONAR

### Ver los Logs COMPLETOS

En EasyPanel:
1. Ve a tu aplicación
2. Click en **Logs** o **Container Logs**
3. Copia TODO el log desde el inicio
4. Compártelo conmigo

### Busca estos mensajes en los logs:

**✅ ÉXITO:**
```
🚀 Iniciando ESCALAFIN...
✅ server.js encontrado
🎉 EJECUTANDO: node server.js
```

**❌ ERROR DE BASE DE DATOS:**
```
Error: P1001: Can't reach database server
```
→ DATABASE_URL incorrecta

**❌ ERROR DE NEXTAUTH:**
```
[next-auth][error][INVALID_URL]
```
→ NEXTAUTH_URL incorrecta

## 📋 INFORMACIÓN QUE NECESITO

Para ayudarte más, necesito:

1. **La URL EXACTA** donde está desplegada tu app en EasyPanel
   - Ejemplo: `https://escalafin-abc123.easypanel.host`

2. **Screenshot de los LOGS** del container
   - Desde que inicia hasta el final

3. **¿Dónde está tu PostgreSQL?**
   - [ ] En EasyPanel (mismo proyecto)
   - [ ] Railway
   - [ ] Supabase
   - [ ] Render
   - [ ] Otro: _______

## 🎯 Checklist Rápido

Antes de contactarme de nuevo, verifica:

- [ ] ✅ NEXTAUTH_URL cambiada a la URL real de EasyPanel
- [ ] ✅ DATABASE_URL apunta a una base de datos accesible
- [ ] ✅ Variables guardadas
- [ ] ✅ Aplicación reiniciada (restart)
- [ ] ✅ Esperé 60 segundos después del restart
- [ ] ✅ Probé abrir la URL en navegador
- [ ] ✅ Revisé los logs del container

---

**CRÍTICO:** El problema más común es NEXTAUTH_URL incorrecta. Cambia eso PRIMERO.
