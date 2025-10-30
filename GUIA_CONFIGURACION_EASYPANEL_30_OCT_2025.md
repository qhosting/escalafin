# 🚀 Guía de Configuración en EasyPanel (30 Octubre 2025)

## ⚠️ Error Común y Solución

### Problema Detectado en las Imágenes

**Error de validación**: "Ruta de compilación" está vacía

**Solución**: Debes ingresar `/` en el campo "Ruta de compilación"

---

## 📋 Pasos de Configuración Correctos

### 1. Configuración del Repositorio GitHub

#### **Tab: Github**
- **Propietario**: `qhosting`
- **Repositorio**: `escalafin-mvp`
- **Rama**: `main`
- **Ruta de compilación**: `/` ← ⚠️ **MUY IMPORTANTE - NO DEJAR VACÍO**

✅ **Verificación**: Debe aparecer `github.com / qhosting / escalafin-mvp`

---

### 2. Selección del Método de Compilación

#### **Tab: Compilación**

Selecciona: **Dockerfile**
- Usa el comando "docker build" ([docs](https://docs.easypanel.io))

#### **Archivo a usar**:
```
Dockerfile
```

**NO seleccionar**:
- ❌ Buildpacks
- ❌ Nixpacks

---

### 3. Variables de Entorno Requeridas

Asegúrate de configurar todas las variables de entorno en la sección correspondiente:

#### **Variables Críticas**:

```bash
# Base de Datos
DATABASE_URL=postgresql://usuario:password@host:5432/escalafin_db

# NextAuth
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu_secret_generado_con_openssl

# AWS S3 (si usas almacenamiento cloud)
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=escalafin-storage
AWS_FOLDER_PREFIX=escalafin/

# Node
NODE_ENV=production
PORT=3000
```

---

## 🔧 Configuración del Servicio

### Health Check
```bash
Endpoint: /api/health
Port: 3000
Intervalo: 30s
```

### Puertos
```
Container Port: 3000
Public Port: (asignado automáticamente)
```

---

## 🐛 Problemas Resueltos en esta Versión

### 1. ✅ Error de Yarn Workspace
**Problema anterior**:
```
Internal Error: app@workspace:.: This package doesn't seem to be present in your lockfile
```

**Solución implementada**:
- Ahora se usa `tsx` directamente en lugar de `yarn tsx`
- Se configura correctamente `NODE_PATH` para encontrar los módulos
- El seed de módulos se ejecuta sin depender del workspace de Yarn

### 2. ✅ Error de Shell/Bash
**Problema anterior**:
```
Bad substitution: ${PIPESTATUS[0]}
```

**Solución implementada**:
- Todos los scripts usan `#!/bin/bash` en lugar de `#!/bin/sh`
- El Dockerfile usa `bash` en el CMD

### 3. ✅ Error de Permisos Corepack
**Problema anterior**:
```
EACCES: permission denied, mkdir '/nonexistent/.cache/node/corepack'
```

**Solución implementada**:
- El usuario `nextjs` tiene un HOME válido: `/home/nextjs`
- Se crea el directorio `.cache` con permisos correctos
- El Dockerfile configura `ENV HOME=/home/nextjs`

---

## 🚦 Proceso de Deploy en EasyPanel

### Paso 1: Configurar el Servicio
1. Ir a **Projects** → Tu proyecto
2. Click en **+ Servicio**
3. Seleccionar **Imagen Docker**

### Paso 2: Configurar GitHub
1. En el tab **Github**:
   - Propietario: `qhosting`
   - Repositorio: `escalafin-mvp`
   - Rama: `main`
   - **Ruta de compilación**: `/` ⚠️

2. Click **Guardar**

### Paso 3: Configurar Compilación
1. En el tab **Compilación**:
   - Seleccionar: **Dockerfile**
   - Archivo: `Dockerfile`

2. Click **Guardar**

### Paso 4: Configurar Variables de Entorno
1. En el tab **Variables de Entorno**
2. Agregar todas las variables listadas arriba
3. Click **Guardar**

### Paso 5: Deploy
1. Click en **Deploy** (botón verde)
2. Esperar a que termine el build (puede tomar 5-10 minutos)
3. Verificar logs durante el proceso

---

## ✅ Verificación Post-Deploy

### 1. Verificar Logs de Inicio
Buscar en los logs las siguientes confirmaciones:

```bash
✅ Esquema sincronizado exitosamente
✅ Módulos PWA sincronizados exitosamente
✅ DB ya inicializada con usuarios
🚀 INICIANDO SERVIDOR NEXT.JS
```

### 2. Verificar Health Check
```bash
curl https://tu-dominio.com/api/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-30T...",
  "database": "connected",
  "version": "1.1.0"
}
```

### 3. Verificar Acceso
1. Abrir `https://tu-dominio.com`
2. Debe cargar la página de login
3. Probar login con usuarios de prueba:

```
Admin:
  Email: admin@escalafin.com
  Password: admin123

Asesor:
  Email: asesor@escalafin.com
  Password: asesor123

Cliente:
  Email: cliente@escalafin.com
  Password: cliente123
```

---

## 🔍 Troubleshooting

### Si el Deploy Falla

#### Error: "Validation error - Build path required"
**Solución**: Asegúrate de poner `/` en "Ruta de compilación"

#### Error: "Failed to build Docker image"
1. Verifica que el Dockerfile existe en el repositorio
2. Verifica que seleccionaste "Dockerfile" en el método de compilación
3. Revisa los logs del build para errores específicos

#### Error: "Health check failed"
1. Verifica que `DATABASE_URL` está correctamente configurada
2. Verifica que la base de datos está accesible desde EasyPanel
3. Verifica que el puerto 3000 está expuesto

#### El sitio no carga (504/502)
1. Verifica los logs del contenedor:
   ```bash
   docker logs <container_id>
   ```
2. Verifica que el servidor Next.js inició correctamente
3. Verifica que no hay errores en la conexión a DB

---

## 📚 Archivos de Referencia

- **Dockerfile**: `/Dockerfile` (raíz del proyecto)
- **Start Script**: `/start-improved.sh`
- **Health Check**: `/healthcheck.sh`
- **Docker Compose**: `/docker-compose.easypanel.yml`

---

## 🎯 Checklist de Verificación

Antes de hacer Deploy, verifica:

- [ ] Ruta de compilación configurada a `/`
- [ ] Método de compilación: Dockerfile
- [ ] Todas las variables de entorno configuradas
- [ ] DATABASE_URL es accesible desde EasyPanel
- [ ] NEXTAUTH_SECRET está generado (32+ caracteres)
- [ ] NEXTAUTH_URL apunta al dominio correcto
- [ ] Puerto 3000 configurado
- [ ] Health check endpoint configurado

---

## 📞 Soporte

Si encuentras problemas no cubiertos en esta guía:

1. Revisa los logs completos del build y runtime
2. Verifica el estado de la base de datos
3. Confirma que todas las variables de entorno están correctas
4. Consulta la documentación de EasyPanel: https://docs.easypanel.io

---

**Última actualización**: 30 Octubre 2025  
**Versión del proyecto**: 1.1.0  
**Commit**: `ddfbaf6` (pre-deploy fixes)

---

## 🚀 Siguiente Paso

Una vez que hayas configurado todo según esta guía:

1. Click en **Deploy**
2. Espera a que termine el build
3. Verifica los logs para confirmar inicio exitoso
4. Accede a tu dominio y prueba el login

¡El sistema debería estar funcionando correctamente! 🎉
