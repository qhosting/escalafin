# 📋 Explicación de Dockerfiles - EscalaFin MVP

## 🎯 Respuesta Directa

### Dockerfile que se usa ACTUALMENTE:

```
📁 Dockerfile (en la raíz del proyecto)
```

**Este es el archivo que:**
- ✅ Se sube a GitHub
- ✅ Se usa en local para testing
- ✅ Se usa en EasyPanel para deployment
- ✅ Contiene todos los fixes recientes (hasta commit `9481b4c`)

---

## 📂 Archivos Dockerfile en el Proyecto

El proyecto tiene **5 archivos** Dockerfile:

| Archivo | Ubicación | Estado | Uso |
|---------|-----------|--------|-----|
| **`Dockerfile`** | `/Dockerfile` | ✅ **ACTIVO** | **Producción (EasyPanel)** |
| `Dockerfile.easypanel` | `/Dockerfile.easypanel` | 🔄 Desactualizado | Versión antigua (27 oct) |
| `Dockerfile.coolify` | `/Dockerfile.coolify` | 📦 Alternativo | Para deploy en Coolify |
| `Dockerfile.production` | `/Dockerfile.production` | 📦 Alternativo | Versión antigua |
| `app/Dockerfile` | `/app/Dockerfile` | 📦 Alternativo | Versión antigua |

---

## 🔍 Diferencias Principales

### ✅ Dockerfile (RAÍZ - ACTUAL)

**Características:**
- Base: `node:18-slim` (Debian-based, glibc)
- Package Manager: Yarn 4.10.3
- Último update: 30 oct 2025 (commit `6f966d9`)
- Tamaño: 198 líneas
- Fixes incluidos:
  - ✅ Prisma Client con ruta relativa
  - ✅ Limpieza de Prisma Client anterior
  - ✅ Modo `node-modules` de Yarn 4
  - ✅ Verificaciones explícitas de generación
  - ✅ Scripts de inicio optimizados

**Header del archivo:**
```dockerfile
# 🚀 DOCKERFILE PRODUCTION - OPTIMIZADO Y TESTEADO
# ===================================
# ✅ Testeado localmente con éxito
# ✅ Node 18-slim (Debian-based, glibc para compatibilidad Next.js SWC)
# ✅ YARN (gestor de paquetes del proyecto)
```

### 🔄 Dockerfile.easypanel (DESACTUALIZADO)

**Características:**
- Base: `node:18-alpine` (Alpine Linux, musl)
- Package Manager: Yarn 4.9.4
- Último update: 27 oct 2025 (commit `2a1418f`)
- Tamaño: 80 líneas
- **NO tiene los fixes recientes** (Prisma ruta relativa, limpieza, etc.)

---

## 🚀 ¿Cuál se usa en EasyPanel?

**Respuesta:** EasyPanel usa el archivo especificado en su configuración. Actualmente debe estar configurado para usar:

```
Dockerfile path: Dockerfile
```

O si está en la raíz por defecto:
```
Dockerfile path: ./Dockerfile
```

---

## 📊 Historia de Commits Recientes (Dockerfile principal)

```
6f966d9 - fix: limpiar Prisma Client anterior antes de regenerar
73ba919 - fix: no copiar .yarn/ y usar binarios directos
43fe9e6 - fix: copiar .yarn/ y usar binario directo de Prisma
a51ebcf - fix: agregar .yarnrc.yml para forzar modo node-modules
150337c - fix: agregar verificaciones explícitas de node_modules
81ed919 - fix: eliminar redirección inválida en comando COPY
```

---

## ✅ Confirmación

**Todos los archivos Dockerfile están en Git:**

```bash
$ git ls-files | grep Dockerfile
Dockerfile                  ← ESTE ES EL ACTIVO
Dockerfile.coolify
Dockerfile.easypanel
Dockerfile.production
app/Dockerfile
```

**Todos se suben a GitHub**, pero el que se está usando y actualizando es **`Dockerfile`** en la raíz.

---

## 🎯 Recomendación

### Para EasyPanel:

1. ✅ **Usar:** `Dockerfile` (raíz del proyecto)
2. ✅ **Verificar** en EasyPanel Settings que el path sea:
   - `Dockerfile` o `./Dockerfile`
3. ✅ **NO usar** `Dockerfile.easypanel` (está desactualizado)

### Para Local Testing:

```bash
# Build con el Dockerfile principal
docker build -f Dockerfile -t escalafin-mvp:test .

# O simplemente (usa Dockerfile por defecto)
docker build -t escalafin-mvp:test .
```

---

## 📋 Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cuál se usa en local? | `Dockerfile` (raíz) |
| ¿Cuál se sube a GitHub? | **Todos** (pero el activo es `Dockerfile`) |
| ¿Cuál usa EasyPanel? | `Dockerfile` (raíz) |
| ¿Cuál tiene los fixes recientes? | `Dockerfile` (raíz) |
| ¿Cuál debo modificar? | `Dockerfile` (raíz) |

---

**Última actualización:** 30 de octubre de 2025, 05:10 AM  
**Dockerfile activo:** `/Dockerfile` (commit `9481b4c`)
