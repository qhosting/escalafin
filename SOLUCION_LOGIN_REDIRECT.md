
# 🔧 SOLUCIÓN: Login Regresa a la Misma Página

## 🔍 **PROBLEMA IDENTIFICADO**

Al intentar iniciar sesión, el sistema:
1. ✅ Valida las credenciales correctamente
2. ✅ Crea la sesión de usuario
3. ❌ Pero vuelve a mostrar el formulario de login

### **Causa Raíz**

El problema está en la variable de entorno `NEXTAUTH_URL` en EasyPanel:

```env
NEXTAUTH_URL=https://escalafin.com
```

**Este dominio NO está resolviendo a tu aplicación**, por lo que NextAuth intenta redirigir ahí después del login y falla, regresando al formulario.

---

## ✅ **SOLUCIONES**

### **Solución 1: Usar el dominio temporal de EasyPanel (RÁPIDA)**

1. Ve a tu proyecto en EasyPanel
2. Copia el dominio temporal que te asignó (ejemplo: `tu-app-123456.easypanel.host`)
3. Actualiza la variable de entorno:

```env
NEXTAUTH_URL=https://tu-app-123456.easypanel.host
```

4. **Rebuild** la aplicación en EasyPanel
5. Prueba el login nuevamente

---

### **Solución 2: Configurar el dominio personalizado correctamente**

Si quieres usar `https://escalafin.com`:

#### **Paso 1: Verificar DNS**
Asegúrate de que el dominio apunte a EasyPanel:

```bash
# Verificar DNS
dig escalafin.com +short
nslookup escalafin.com
```

Debe apuntar a la IP de tu servidor EasyPanel.

#### **Paso 2: Configurar en EasyPanel**

1. Ve a tu servicio en EasyPanel
2. Navega a **Domains** o **Network**
3. Agrega el dominio: `escalafin.com`
4. Verifica que el SSL esté activo
5. Prueba acceder a `https://escalafin.com` - debe cargar la app

#### **Paso 3: Verificar NEXTAUTH_URL**

Solo cuando la app esté accesible en `https://escalafin.com`:

```env
NEXTAUTH_URL=https://escalafin.com
```

---

### **Solución 3: Mejoras en el Código (YA APLICADAS)**

Hemos mejorado el código para manejar mejor los redirects:

#### **Cambios en `/lib/auth.ts`:**

```typescript
async redirect({ url, baseUrl }) {
  console.log('🔄 Redirect callback:', { url, baseUrl });
  
  // Si es una URL relativa, usar baseUrl actual
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  
  // Si la URL es del mismo dominio, permitir
  try {
    const urlOrigin = new URL(url).origin;
    const baseOrigin = new URL(baseUrl).origin;
    
    if (urlOrigin === baseOrigin) {
      return url;
    }
  } catch (error) {
    console.error('❌ Error parseando URLs:', error);
  }
  
  // Por defecto, redirigir al baseUrl actual
  return baseUrl;
}
```

#### **Cambios en `/components/auth/login-form.tsx`:**

```typescript
// Ahora usa window.location.href para forzar la navegación
if (result?.ok) {
  const session = await getSession();
  
  let redirectUrl = '/';
  if (session?.user?.role === 'ADMIN') {
    redirectUrl = '/admin/dashboard';
  } else if (session?.user?.role === 'ASESOR') {
    redirectUrl = '/asesor/dashboard';
  } else if (session?.user?.role === 'CLIENTE') {
    redirectUrl = '/cliente/dashboard';
  }
  
  window.location.href = redirectUrl;
}
```

---

## 🚀 **PASOS PARA APLICAR EL FIX**

### **1. Actualizar el Código en GitHub**

```bash
cd /home/ubuntu/escalafin_mvp

# Verificar cambios
git status

# Agregar los archivos modificados
git add app/lib/auth.ts app/components/auth/login-form.tsx

# Commit
git commit -m "Fix: Mejorar manejo de redirects en login"

# Push a GitHub
git push origin main
```

### **2. Actualizar NEXTAUTH_URL en EasyPanel**

1. Ve a tu servicio en EasyPanel
2. Navega a **Environment** o **Variables de Entorno**
3. Cambia:
   ```
   De: NEXTAUTH_URL=https://escalafin.com
   A: NEXTAUTH_URL=https://tu-dominio-easypanel.host
   ```
4. **Guarda** los cambios

### **3. Rebuild en EasyPanel**

1. Ve a **Deployments** o **Build**
2. Click en **Rebuild** o **Redeploy**
3. Espera a que termine el build (5-10 minutos)
4. Verifica que la app esté corriendo

### **4. Probar el Login**

1. Abre `https://tu-dominio-easypanel.host/auth/login`
2. Ingresa:
   - Email: `admin@escalafin.com`
   - Password: `admin123`
3. Click en **Iniciar Sesión**
4. ✅ Deberías ser redirigido a `/admin/dashboard`

---

## 📊 **VERIFICACIÓN**

### **Verificar que la app esté accesible:**

```bash
# Desde tu terminal
curl -I https://tu-dominio-easypanel.host

# Debe devolver: HTTP/2 200
```

### **Verificar los logs en EasyPanel:**

1. Ve a **Logs** o **Console**
2. Busca estos mensajes al hacer login:
   ```
   🔄 Iniciando login con: { email: 'admin@escalafin.com' }
   ✅ Login exitoso, obteniendo sesión...
   📊 Sesión obtenida: { user: { role: 'ADMIN' } }
   🔄 Redirigiendo a admin dashboard...
   ```

### **Verificar en el navegador:**

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Haz login
4. Verifica que NO haya errores de CORS o Network
5. Verifica que la URL cambie a `/admin/dashboard` correctamente

---

## 🔍 **DIAGNÓSTICO ADICIONAL**

Si el problema persiste después de aplicar el fix:

### **1. Verificar cookies:**

```javascript
// En la consola del navegador
document.cookie
```

Debe incluir: `next-auth.session-token` o similar.

### **2. Verificar almacenamiento de sesión:**

```javascript
// En la consola del navegador
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
```

Debe devolver un objeto con `user` y `expires`.

### **3. Verificar que el puerto 3000 esté expuesto:**

En EasyPanel:
- Settings → Ports
- Verifica: `Container Port: 3000`, `Protocol: HTTP`, `Public: Yes`

---

## 📝 **VARIABLES DE ENTORNO CORRECTAS**

### **Para desarrollo local:**
```env
NEXTAUTH_URL=http://localhost:3000
```

### **Para EasyPanel (dominio temporal):**
```env
NEXTAUTH_URL=https://tu-app-123456.easypanel.host
```

### **Para EasyPanel (dominio personalizado):**
```env
NEXTAUTH_URL=https://escalafin.com
```

**IMPORTANTE:** `NEXTAUTH_URL` **DEBE** ser la URL exacta donde la app está accesible.

---

## ✅ **RESULTADO ESPERADO**

Después de aplicar el fix:

1. ✅ Login funciona correctamente
2. ✅ Redirige al dashboard según el rol
3. ✅ La sesión persiste al recargar la página
4. ✅ No hay errores en la consola
5. ✅ Las cookies se guardan correctamente

---

## 📞 **SOPORTE**

Si el problema persiste:

1. Captura los logs del navegador (Console + Network)
2. Captura los logs de EasyPanel
3. Verifica que `NEXTAUTH_URL` sea correcto
4. Verifica que el puerto 3000 esté expuesto

---

**Última actualización:** 28/10/2025
**Versión:** 1.0
**Estado:** ✅ Fix aplicado y listo para deploy

---
