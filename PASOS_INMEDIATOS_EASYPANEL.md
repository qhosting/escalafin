
# 🚀 PASOS INMEDIATOS - EasyPanel

**Tu app está funcionando perfectamente** (✓ Ready in 162ms)  
**Solo necesita configuración de red para ser visible**

---

## ✅ PASO 1: Verificar Puertos (⏱️ 1 minuto)

### En EasyPanel:

1. Ve a tu aplicación **escalafin_mvp**
2. Click en **"Settings"** o **"Configuración"**
3. Busca la sección **"Network"**, **"Ports"**, **"Red"**, o **"Puertos"**

### ¿Qué deberías ver?

```
┌─────────────────────────────────────┐
│ PORTS / PUERTOS                     │
├─────────────────────────────────────┤
│ Container Port: 3000                │ ← Debe existir
│ Protocol: HTTP                       │
│ Public / Público: ✓                 │ ← Debe estar marcado
│ Domain (opcional): tu-dominio.com   │
└─────────────────────────────────────┘
```

### ❌ Si NO ves ninguna configuración de puerto:

**Agrégala:**

```
1. Click en "+ Add Port" o "+ Agregar Puerto"
2. Container Port: 3000
3. Public Port: 80 (o dejar vacío si usa dominio)
4. Protocol: HTTP
5. Enable Public Access: ✓ (marcar checkbox)
6. Click "Save" o "Guardar"
```

### ✅ Si YA existe el puerto 3000:

**Verificar que:**
- [ ] Public/Público está marcado (✓)
- [ ] El puerto es 3000
- [ ] Protocol es HTTP

---

## 🔄 PASO 2: Reiniciar (⏱️ 30 segundos)

Después de configurar/verificar el puerto:

```
1. Click en "Restart" o "Reiniciar"
2. Esperar 20-30 segundos
3. Logs deben mostrar nuevamente: "✓ Ready in XXXms"
```

---

## 🌐 PASO 3: Obtener URL de Acceso

### Opción A: Tienes Dominio Configurado

```
https://tu-dominio.com
```

### Opción B: NO tienes Dominio

Buscar en EasyPanel:
- "Public URL"
- "Access URL"
- O directamente: `http://[IP_DEL_SERVIDOR]:80`

---

## 🧪 PASO 4: Probar Acceso (⏱️ 1 minuto)

### Test 1: Health Check

Abrir en navegador o ejecutar en terminal:

```bash
# Con dominio
curl https://tu-dominio.com/api/health

# Sin dominio (reemplazar IP)
curl http://IP_DEL_SERVIDOR:80/api/health

# O directamente al puerto 3000 si está expuesto
curl http://IP_DEL_SERVIDOR:3000/api/health
```

**Resultado esperado:**
```json
{"status":"ok"}
```

### Test 2: Página de Login

Abrir en navegador:

```
https://tu-dominio.com/auth/login
```

**Debe mostrar:**
- ✅ Formulario de login de EscalaFin
- ✅ Estilos cargados
- ✅ Sin errores en consola del navegador

---

## ❌ SI AÚN NO FUNCIONA

### Compartir Esta Información:

#### 1. Screenshot de Configuración de Puertos

En EasyPanel → Settings → Network/Ports → Tomar screenshot

#### 2. Resultado de Health Check desde el Contenedor

En EasyPanel → Console/Terminal del contenedor:

```bash
curl http://localhost:3000/api/health
```

Copiar resultado completo.

#### 3. Variables de Entorno Configuradas

En EasyPanel → Settings → Environment:

Verificar que existan:
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
- `NEXTAUTH_URL=...` (con tu dominio o IP correcto)

#### 4. Logs Completos

Últimas 50 líneas de logs (de runtime, no de build).

---

## 💡 CONFIGURACIÓN RÁPIDA RECOMENDADA

### Si quieres acceso INMEDIATO sin dominio:

```yaml
Settings → Network:
  ╔═══════════════════════════════════════╗
  ║ Container Port: 3000                  ║
  ║ Public Port: 80                       ║
  ║ Protocol: HTTP                         ║
  ║ Public: ✓                             ║
  ╚═══════════════════════════════════════╝

Acceso:
  http://IP_DEL_SERVIDOR
  # o
  http://IP_DEL_SERVIDOR/auth/login
```

### Si tienes dominio:

```yaml
Settings → Network:
  ╔═══════════════════════════════════════╗
  ║ Container Port: 3000                  ║
  ║ Protocol: HTTP                         ║
  ║ Public: ✓                             ║
  ║ Domain: escalafin.tu-dominio.com      ║
  ║ SSL: Enable ✓                         ║
  ╚═══════════════════════════════════════╝

Acceso:
  https://escalafin.tu-dominio.com
  # o
  https://escalafin.tu-dominio.com/auth/login
```

---

## 📋 CHECKLIST VISUAL

Marca según vayas completando:

```
[ ] 1. Abrir EasyPanel → Settings → Network
[ ] 2. Verificar/Agregar puerto 3000
[ ] 3. Marcar "Public" o "Enable Public Access"
[ ] 4. Guardar cambios
[ ] 5. Reiniciar el servicio
[ ] 6. Esperar 30 segundos
[ ] 7. Probar: curl http://[URL]/api/health
[ ] 8. Abrir navegador: http://[URL]/auth/login
[ ] 9. ✅ ¡Ver la página de login!
```

---

## 🎯 LO QUE DEBERÍAS VER

### En Navegador (http://tu-url/auth/login):

```
╔══════════════════════════════════════════════╗
║                                              ║
║         🏢 ESCALAFIN MVP                     ║
║                                              ║
║  ┌────────────────────────────────────┐    ║
║  │ 📧 Email                           │    ║
║  │ [                                ] │    ║
║  └────────────────────────────────────┘    ║
║                                              ║
║  ┌────────────────────────────────────┐    ║
║  │ 🔒 Contraseña                      │    ║
║  │ [                                ] │    ║
║  └────────────────────────────────────┘    ║
║                                              ║
║          [ INICIAR SESIÓN ]                 ║
║                                              ║
╚══════════════════════════════════════════════╝
```

### Consola del Navegador (F12):

```
✅ Sin errores rojos
✅ Recursos cargando correctamente
✅ Sin 404 o 500
```

---

## ⚡ RESUMEN DE 30 SEGUNDOS

Tu app **está corriendo perfectamente**. Solo necesitas:

1. **EasyPanel** → **Settings** → **Network**
2. **Agregar/verificar puerto 3000** como público
3. **Save** y **Restart**
4. **Probar** en navegador

**Eso es todo** 🎉

---

## 📞 SIGUIENTE PASO

Una vez que configures el puerto:

**Prueba esto en tu navegador:**
```
http://[TU_IP_O_DOMINIO]/api/health
```

**Debe responder:**
```json
{"status":"ok"}
```

Si ves ese mensaje → ✅ **¡FUNCIONÓ!**

Luego ve a:
```
http://[TU_IP_O_DOMINIO]/auth/login
```

Y deberías ver el login de EscalaFin.

---

**¿Listo?** Ve a EasyPanel ahora y configura el puerto 🚀
