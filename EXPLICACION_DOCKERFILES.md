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

El proyecto tiene **1 único archivo** Dockerfile:

| Archivo | Ubicación | Estado | Uso |
|---------|-----------|--------|-----|
| **`Dockerfile`** | `/Dockerfile` | ✅ **ACTIVO** | **Producción (EasyPanel)** |

**✅ Archivos eliminados (commit `b3864f2`):**
- ~~`Dockerfile.easypanel`~~ (desactualizado)
- ~~`Dockerfile.coolify`~~ (alternativo)
- ~~`Dockerfile.production`~~ (antiguo)
- ~~`app/Dockerfile`~~ (antiguo)

---

## 🔍 Características del Dockerfile Único

### ✅ Dockerfile (RAÍZ - PRODUCCIÓN)

**Características:**
- Base: `node:18-slim` (Debian-based, glibc)
- Package Manager: Yarn 4.10.3
- Último update: 30 oct 2025 (commit `9481b4c`)
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

**Solo hay UN archivo Dockerfile en Git:**

```bash
$ git ls-files | grep Dockerfile
Dockerfile                  ← ÚNICO ARCHIVO
```

**Este es el único Dockerfile** que se sube a GitHub y se usa en todos los ambientes (local, EasyPanel).

---

## 🎯 Uso del Dockerfile

### Para EasyPanel:

**Configuración en EasyPanel Settings:**
```
Dockerfile path: Dockerfile
```
o simplemente:
```
Dockerfile path: ./Dockerfile
```

### Para Local Testing:

```bash
# Build (usa Dockerfile por defecto)
docker build -t escalafin-mvp:test .

# O especificando el archivo
docker build -f Dockerfile -t escalafin-mvp:test .
```

---

## 📋 Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cuál se usa en local? | `Dockerfile` (raíz) - **ÚNICO** |
| ¿Cuál se sube a GitHub? | `Dockerfile` (raíz) - **ÚNICO** |
| ¿Cuál usa EasyPanel? | `Dockerfile` (raíz) - **ÚNICO** |
| ¿Cuál tiene los fixes recientes? | `Dockerfile` (raíz) - **ÚNICO** |
| ¿Cuál debo modificar? | `Dockerfile` (raíz) - **ÚNICO** |

---

**Última actualización:** 30 de octubre de 2025, 05:30 AM  
**Dockerfile único:** `/Dockerfile` (commit `9481b4c`)  
**Cleanup realizado:** Commit `b3864f2` (eliminados 4 Dockerfiles alternativos)
