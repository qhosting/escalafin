
# Guía Completa: Limpiar Cache en EasyPanel

## 📋 ¿Qué es el Cache de Construcción?

EasyPanel usa Docker para construir tu aplicación. Docker guarda capas intermedias (cache) para acelerar builds futuros. 

**Problema**: A veces el cache guarda versiones antiguas de archivos críticos.

---

## 🎯 Cuándo Limpiar el Cache

Limpia el cache de EasyPanel cuando:

✅ Modificaste el `Dockerfile` pero los cambios no se reflejan  
✅ Actualizaste `package.json` o `package-lock.json` pero usa versiones viejas  
✅ Cambiaste scripts de inicio pero sigue usando los antiguos  
✅ La app funciona local pero falla en EasyPanel  
✅ Ves errores como "archivo no encontrado" pero el archivo existe en GitHub

---

## 🔧 Método 1: Limpiar Cache desde la Interfaz (RECOMENDADO)

### Pasos Detallados:

1. **Accede a EasyPanel**
   - Ve a: https://easypanel.qhosting.space
   - Inicia sesión con tus credenciales

2. **Selecciona tu Proyecto**
   - En el dashboard, busca: **"escalafin"**
   - Haz clic en el nombre del proyecto

3. **Ve a tu Servicio**
   - Dentro del proyecto, busca el servicio: **"app"** o **"web"**
   - Haz clic para abrir la configuración

4. **Abre la Sección de Builds**
   - En el menú lateral, busca: **"Builds"** o **"Deployments"**
   - Haz clic para ver el historial de construcciones

5. **Activa "Clear Build Cache"**
   - Busca un checkbox o toggle que diga:
     - ✓ **Clear build cache**
     - ✓ **No cache**
     - ✓ **Rebuild from scratch**
   - **ACTÍVALO** (marca el checkbox)

6. **Inicia el Rebuild**
   - Haz clic en el botón: **"Rebuild"** o **"Deploy"**
   - Confirma la acción si aparece un diálogo

7. **Monitorea el Build**
   - Ve a la pestaña: **"Logs"** o **"Build Logs"**
   - Observa el progreso en tiempo real
   - Busca mensajes como:
     ```
     ✓ Cloning repository...
     ✓ Building image...
     ✓ Starting container...
     ```

8. **Verifica el Deploy Exitoso**
   - Espera a que el estado cambie a: **"Running"** o **"Deployed"**
   - Prueba la URL de tu app

---

## 🖥️ Método 2: Limpiar Cache desde Terminal SSH (AVANZADO)

Si tienes acceso SSH al servidor de EasyPanel:

```bash
# Conectar al servidor
ssh usuario@easypanel.qhosting.space

# Ver todos los contenedores
docker ps -a

# Identificar el contenedor de escalafin
docker ps -a | grep escalafin

# Detener el contenedor actual
docker stop <container-id>

# Eliminar el contenedor
docker rm <container-id>

# Eliminar la imagen antigua
docker rmi <image-id>

# Limpiar todo el cache de Docker (CUIDADO: afecta TODOS los proyectos)
docker builder prune -a --force

# Rebuild desde EasyPanel UI
# (Ya no necesitas hacerlo desde terminal, usa la interfaz)
```

⚠️ **ADVERTENCIA**: El comando `docker builder prune -a` eliminará el cache de **TODOS** tus proyectos en el servidor, no solo EscalaFin.

---

## 📝 Método 3: Forzar Rebuild con .dockerignore

Si los métodos anteriores no funcionan, puedes forzar un rebuild modificando un archivo que Docker siempre lee:

1. **Modifica el Dockerfile**
   ```bash
   # Agrega un comentario con la fecha actual
   echo "# Build: $(date)" >> Dockerfile
   ```

2. **Commit y Push**
   ```bash
   git add Dockerfile
   git commit -m "Force rebuild - clear cache"
   git push origin main
   ```

3. **Rebuild en EasyPanel**
   - Sin necesidad de marcar "Clear cache"
   - El cambio en Dockerfile invalida el cache automáticamente

---

## 🛠️ Scripts Automáticos que Creamos

### 1. Script de Verificación Pre-Deploy

```bash
# Ejecutar ANTES de hacer push
./scripts/pre-deploy-verification.sh
```

**Verifica**:
- ✓ Todos los archivos críticos existen
- ✓ package-lock.json está sincronizado
- ✓ No hay cambios sin commitear
- ✓ Scripts tienen permisos de ejecución
- ✓ Dockerfile es coherente

### 2. Script de Diagnóstico de Cache

```bash
# Ejecutar si sospechas problemas de cache
./scripts/cache-diagnostics.sh
```

**Detecta**:
- ⚠️ package-lock.json desactualizado
- ⚠️ Commits sin hacer push
- ⚠️ Archivos faltantes referenciados en Dockerfile
- ⚠️ Actividad antigua en el repo

---

## 🎨 Flujo de Trabajo Recomendado

### Antes de Cada Deploy:

```bash
# 1. Verifica que todo esté bien
./scripts/pre-deploy-verification.sh

# 2. Si hay errores, corrígelos primero

# 3. Si todo está bien, haz push
git add .
git commit -m "Tu mensaje"
git push origin main

# 4. Si el deploy falla en EasyPanel:
#    → Ve a EasyPanel UI
#    → Marca "Clear build cache"
#    → Haz clic en "Rebuild"
```

### Después de Problemas de Cache:

```bash
# 1. Diagnostica el problema
./scripts/cache-diagnostics.sh

# 2. Corrige los problemas detectados

# 3. Limpia cache en EasyPanel (UI)

# 4. Verifica nuevamente
./scripts/pre-deploy-verification.sh

# 5. Deploy
```

---

## 📊 Checklist Visual para Limpiar Cache

```
┌─────────────────────────────────────────┐
│  LIMPIAR CACHE EN EASYPANEL             │
├─────────────────────────────────────────┤
│                                         │
│  □ 1. Acceder a EasyPanel UI           │
│  □ 2. Seleccionar proyecto "escalafin" │
│  □ 3. Ir a sección "Builds"            │
│  □ 4. Marcar ✓ "Clear build cache"     │
│  □ 5. Clic en "Rebuild"                │
│  □ 6. Monitorear logs en tiempo real   │
│  □ 7. Verificar estado "Running"       │
│  □ 8. Probar la aplicación             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "No encuentro la opción de Clear Cache"

**Solución**:
- Busca en la sección: **"Builds"**, **"Deployments"** o **"Settings"**
- Puede llamarse:
  - "Clear build cache"
  - "No cache"
  - "Rebuild from scratch"
  - "Prune cache"

### Problema: "Limpié el cache pero sigue usando versión antigua"

**Solución**:
1. Verifica que hiciste `git push` correctamente:
   ```bash
   git log origin/main -1
   # Debe mostrar tu último commit
   ```

2. Verifica en GitHub que los archivos se actualizaron

3. En EasyPanel, verifica que esté conectado a la rama correcta

4. Como último recurso, elimina el servicio completo y créalo de nuevo

### Problema: "El cache se llena constantemente"

**Solución**:
- Optimiza tu Dockerfile para usar multi-stage builds
- Revisa qué archivos estás copiando (evita copiar `node_modules` innecesarios)
- Usa `.dockerignore` apropiadamente

---

## 📚 Recursos Adicionales

- [Documentación oficial de Docker sobre cache](https://docs.docker.com/build/cache/)
- [Guía de EasyPanel](https://easypanel.io/docs)
- Scripts de verificación en: `/home/ubuntu/escalafin_mvp/scripts/`

---

## ✅ Resumen

**Para limpiar cache en EasyPanel:**

1. **UI (Fácil)**:
   - EasyPanel → Proyecto → Builds
   - ✓ Clear build cache
   - → Rebuild

2. **Scripts (Preventivo)**:
   ```bash
   ./scripts/pre-deploy-verification.sh
   ./scripts/cache-diagnostics.sh
   ```

3. **Terminal (Avanzado)**:
   ```bash
   docker builder prune -a
   ```

**¡Siempre usa los scripts de verificación ANTES de hacer deploy!**

---

*Guía actualizada: 29 de Octubre, 2025*  
*Proyecto: EscalaFin MVP - Sistema de Gestión de Préstamos*
