
# 🎯 INSTRUCCIONES PASO A PASO (CON IMÁGENES)

## 🔴 PROBLEMA QUE ESTÁS VIENDO

Tu screenshot `dok.jpg` muestra:

```
┌─────────────────────────────────────────────┐
│  Error de validación                        │
├─────────────────────────────────────────────┤
│  Propietario *                              │
│  qhosting                                   │
│                                             │
│  Repositorio *                              │
│  escalafin-mvp                             │
│                                             │
│  Rama *                                     │
│  main                                       │
│                                             │
│  Ruta de compilación *                      │
│  |                          👈 ❌ VACÍO     │
│  Required                                   │
│                                             │
│  [Guardar]                                  │
└─────────────────────────────────────────────┘
```

**EL PROBLEMA**: El campo "Ruta de compilación" está vacío pero es REQUERIDO.

## ✅ SOLUCIÓN (3 CLICS)

### Paso 1: Ir a la Configuración

```
1. En EasyPanel, abre tu proyecto "escalafin_mvp"
2. Ve a la pestaña "Settings" o "Configuración"
3. Busca la sección "GitHub" o "Source"
```

### Paso 2: Llenar el Campo Vacío

En el campo **"Ruta de compilación"** (Build Path) escribe:

```
/
```

Sí, solo un slash `/`. Así debe quedar:

```
┌─────────────────────────────────────────────┐
│  Ruta de compilación *                      │
│  /                         👈 ✅ LLENO      │
│  Esta debe ser una rama válida...           │
└─────────────────────────────────────────────┘
```

### Paso 3: Guardar y Reconstruir

1. Click en **"Guardar"** (botón verde)
2. El error debe desaparecer ✅
3. Ve a la pestaña de tu aplicación
4. Click en **"Rebuild"** o **"Reconstruir"**
5. Espera 5-10 minutos

## 📸 TU SEGUNDO SCREENSHOT (dok2.jpg)

Muestra las opciones de compilación. Debes seleccionar:

```
┌─────────────────────────────────────────────┐
│  Compilación                                │
├─────────────────────────────────────────────┤
│  ○ Dockerfile                              │  👈 ✅ SELECCIONA ESTA
│    Usa el comando "docker build"           │
│                                             │
│  ○ Buildpacks                              │  👈 ❌ NO ESTA
│    Elija sus buildpacks deseados           │
│                                             │
│  ○ Nixpacks                                │  👈 ❌ NO ESTA
│    Nueva forma de crear aplicaciones...    │
└─────────────────────────────────────────────┘
```

**IMPORTANTE**: Debes seleccionar **Dockerfile** (primera opción).

## 🌐 Variables de Entorno

Asegúrate de tener MÍNIMO estas variables configuradas:

### En EasyPanel > Tu App > Environment Variables

```bash
# Base de Datos (OBLIGATORIA)
DATABASE_URL=postgresql://usuario:password@host:5432/database?schema=public

# NextAuth (OBLIGATORIAS)
NEXTAUTH_URL=https://tu-app.easypanel.host
NEXTAUTH_SECRET=un-string-aleatorio-muy-largo-minimo-64-caracteres-aqui

# Puerto (OPCIONAL, por defecto es 3000)
PORT=3000
```

**NOTA**: Si usas Railway, Supabase, o Render para la base de datos, copia la URL directamente de ahí.

## 🔄 Proceso de Rebuild

Cuando hagas rebuild, en los logs verás esto:

### ✅ Build Exitoso:
```
📦 Instalando dependencias...
✅ 387 paquetes instalados
🔧 Generando Prisma Client...
🏗️  Building Next.js...
✅ Build completado
📂 Verificando estructura del standalone...
✅ server.js encontrado en standalone/app/
```

### 🚀 Runtime Exitoso:
```
🚀 Iniciando ESCALAFIN...
📦 PATH configurado
🔄 Aplicando migraciones si es necesario...
✅ Migraciones aplicadas correctamente
🌱 Verificando si necesita seed...
👥 Usuarios en la base de datos: 3
✅ Base de datos ya tiene usuarios, omitiendo seed
✅ server.js encontrado en /app/server.js
🚀 Iniciando servidor Next.js standalone...
🎉 EJECUTANDO: node server.js
```

### ❌ Si ves errores:

**Error de módulo no encontrado:**
```
Error: Cannot find module 'next/dist/server/next-server'
```
→ Limpia el cache de build y reconstruye

**Error de base de datos:**
```
Error: P1001: Can't reach database server
```
→ Verifica tu DATABASE_URL y que el firewall permita conexiones desde EasyPanel

## 🎯 Checklist Visual

Antes de hacer rebuild, verifica que TODO esté marcado:

```
EasyPanel Configuración:
[X] Propietario: qhosting
[X] Repositorio: escalafin-mvp
[X] Rama: main
[X] Ruta de compilación: /                  👈 ESTE ERA EL QUE FALTABA
[X] Método: Dockerfile (seleccionado)

Variables de Entorno:
[X] DATABASE_URL configurada
[X] NEXTAUTH_URL configurada
[X] NEXTAUTH_SECRET configurada

Recursos:
[X] Memoria: 2GB (recomendado)
[X] CPU: 1 vCore

Red:
[X] Puerto: 3000
[X] Protocolo: HTTP
```

## 📱 Acceso a la Aplicación

Una vez que el build termine y el health check esté ✅:

1. Tu URL será algo como: `https://escalafin-xxxx.easypanel.host`
2. Abre la URL en el navegador
3. Deberías ver la pantalla de login de ESCALAFIN
4. Usa las credenciales de prueba (ver CREDENCIALES_PRUEBA.md)

## 🆘 Si TODAVÍA No Se Ve

Si después de hacer TODO lo anterior sigue sin verse:

### 1. Verifica el Health Check

En EasyPanel, busca el estado del health check:
- ✅ HEALTHY = La app está corriendo
- ❌ UNHEALTHY = Hay un problema

### 2. Revisa los Logs

En EasyPanel > Logs, busca la última línea. Debe decir:
```
🎉 EJECUTANDO: node server.js
```

Si no lo dice, o hay errores, **copia TODO el log** y compártelo.

### 3. Prueba el Endpoint de Health

Abre en tu navegador:
```
https://tu-app.easypanel.host/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T...",
  "uptime": 123.45
}
```

Si NO ves eso, hay un problema con el routing.

## 📞 Soporte Adicional

Si nada de esto funciona, necesito que me compartas:

1. **Screenshot completo de los logs** del container en EasyPanel
2. **Screenshot de las variables de entorno** (puedes ocultar los valores sensibles)
3. **Screenshot del estado del health check**
4. **La URL** completa donde está desplegado

Con eso puedo diagnosticar exactamente qué está pasando.

---

**Creado**: 24 de Octubre, 2025
**Última actualización de GitHub**: Commit `5742e95`
**Siguiente paso**: Agregar `/` en "Ruta de compilación" y rebuild
