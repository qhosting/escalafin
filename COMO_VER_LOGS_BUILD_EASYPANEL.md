
# 📋 Cómo Ver Logs Completos del Build en EasyPanel

Tu build está fallando pero necesitamos ver **QUÉ parte específica** falló.

---

## 🔍 PASO 1: Acceder a los Logs del Build

### Opción A: Desde la Interfaz de EasyPanel

1. Ve a tu aplicación **escalafin** en EasyPanel
2. Click en la pestaña **"Logs"** o **"Registros"**
3. Busca la opción **"Build Logs"** o **"Logs de Compilación"**
4. Deberías ver algo como:

```
┌─────────────────────────────────────┐
│ Logs                                │
├─────────────────────────────────────┤
│ ○ Runtime Logs                      │
│ ● Build Logs  ← CLICK AQUÍ         │
└─────────────────────────────────────┘
```

### Opción B: Durante el Deploy

Cuando haces click en "Deploy" o "Rebuild", EasyPanel generalmente muestra los logs en tiempo real. Busca el output completo.

---

## 🎯 QUÉ BUSCAR EN LOS LOGS

El error puede estar en cualquiera de estas fases:

### Fase 1: Instalación de Dependencias
```bash
# Buscar líneas como:
yarn install v1.22.x
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...

# Error posible:
error An unexpected error occurred: "..."
```

### Fase 2: Prisma Generate
```bash
# Buscar:
yarn prisma generate

# Error posible:
Error: Cannot find module '.prisma/client'
Error: Prisma schema not found
```

### Fase 3: Next.js Build
```bash
# Buscar:
yarn build
Creating an optimized production build...

# Error posible:
Error: Build failed
Module not found: Can't resolve '...'
Type error: ...
```

### Fase 4: Standalone Output
```bash
# Buscar:
Copying standalone output...
ls -la .next/standalone/

# Error posible:
No such file or directory: .next/standalone
```

---

## 📸 COMPARTIR LOS LOGS

Por favor, comparte:

### 1. Todo el Output del Build

Copia **TODO** desde el inicio hasta el error. Por ejemplo:

```
[builder] Step 1/25 : FROM node:20-alpine AS base
[builder] ---> abc123def456
[builder] Step 2/25 : RUN apk add --no-cache ...
...
[builder] Step 15/25 : RUN yarn build
[builder] ---> Running in xyz789abc123
[builder] yarn run v1.22.19
[builder] $ next build
[builder] ▲ Next.js 14.2.28
[builder] Creating an optimized production build ...
[builder] ✓ Compiled successfully
[builder] ✓ Linting and checking validity of types
[builder] ✓ Collecting page data
[builder] ERROR: Something failed here ← ESTO ES LO IMPORTANTE
[builder] error Command failed with exit code 1.
```

### 2. Específicamente las Últimas 100 Líneas

Si los logs son muy largos, comparte al menos las **últimas 100 líneas** donde aparece el error.

---

## 🔧 SI NO PUEDES VER LOS LOGS EN EASYPANEL

### Opción 1: Logs del Sistema

Ir a la consola del servidor de EasyPanel y ejecutar:

```bash
# Ver logs de Docker buildx
docker buildx build --progress=plain -f /etc/easypanel/projects/cloudmx/escalafin/code/Dockerfile \
  /etc/easypanel/projects/cloudmx/escalafin/code/

# O ver logs del último build
docker logs $(docker ps -a | grep escalafin | head -1 | awk '{print $1}')
```

### Opción 2: Ejecutar Build Manual

```bash
cd /etc/easypanel/projects/cloudmx/escalafin/code/

# Build manual con output completo
docker build --progress=plain --no-cache -t test-escalafin . 2>&1 | tee build.log

# Luego compartir build.log
```

---

## 🎯 ERRORES COMUNES Y SUS SÍNTOMAS

### Error 1: Falta `yarn.lock` o está Corrompido
```
error Couldn't find package.json
error The lockfile is outdated
```

### Error 2: Versión de Node Incompatible
```
error <package>@<version>: The engine "node" is incompatible
```

### Error 3: Memoria Insuficiente Durante Build
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

### Error 4: Timeout de Red
```
error An unexpected error occurred: "https://registry.yarnpkg.com/...: ESOCKETTIMEDOUT"
```

### Error 5: Prisma Schema Error
```
Error: 
Prisma schema validation failed
Error: Generator "client" failed:
```

### Error 6: TypeScript Compilation Error
```
Type error: Cannot find module '...' or its corresponding type declarations.
```

### Error 7: Next.js Build Error
```
Error occurred prerendering page "..."
Error: Module not found: Can't resolve '...'
```

---

## ⚡ ACCIÓN INMEDIATA

**Por favor comparte:**

1. **Todo el log del build** desde EasyPanel → Logs → Build Logs
2. O al menos las **últimas 50-100 líneas** donde aparece el error
3. Screenshot si es necesario

**Sin ver el error específico, no puedo diagnosticar el problema.**

---

## 💡 MIENTRAS TANTO: Verificar Local

Puedes verificar si el build funciona localmente:

```bash
cd /home/ubuntu/escalafin_mvp

# Test del build
docker build --progress=plain -t test-escalafin -f Dockerfile . 2>&1 | tee local-build.log

# Si falla localmente, compartir local-build.log
# Si funciona localmente, el problema es específico de EasyPanel
```

---

## 📞 FORMATO PARA COMPARTIR

```markdown
### Build Logs de EasyPanel

[Pegar aquí TODO el output del build]

### Última Línea de Error

[La línea específica donde falló]

### Contexto Adicional

- Commit SHA: c2804bad92f... (ya lo vi en el error)
- Dockerfile usado: /etc/easypanel/projects/cloudmx/escalafin/code/Dockerfile
- Duración del build antes de fallar: ~155-274 segundos
```

---

**Esperando los logs para poder diagnosticar** 🔍
