
# 🔧 Fix: Sincronización de Deploy con Código Local

**Fecha:** 29 de Octubre de 2025  
**Problema:** Deploy no muestra cambios visibles en local  
**Estado:** ✅ RESUELTO

---

## 🔍 Diagnóstico del Problema

### Síntoma
El usuario reportó que después de crear un nuevo deploy, los cambios visibles en `localhost:3000` no aparecían en la versión deployada.

### Causa Raíz Identificada

**1. Commits locales no sincronizados**
- El repositorio local tenía commit `127ae53` 
- Los repositorios remotos (GitHub) estaban en commit `67d7fc1`
- El deploy usaba el código de GitHub, que estaba desactualizado

**2. Ruta absoluta en Prisma Schema**
- El sistema de checkpoint automático agregó una línea problemática:
  ```prisma
  output = "/home/ubuntu/escalafin_mvp/app/node_modules/.prisma/client"
  ```
- Esta ruta absoluta no existe en contenedores Docker de producción
- Causaba inconsistencias entre desarrollo y producción

---

## ✅ Soluciones Implementadas

### 1. Sincronización de Repositorios

```bash
# Push a ambos repositorios
git push origin main
git push escalafinmx main
```

**Resultado:**
- ✅ Commit local `127ae53` subido a GitHub
- ✅ Repositorio `qhosting/escalafin` actualizado
- ✅ Repositorio `qhosting/escalafinmx` actualizado

### 2. Corrección de Prisma Schema

**Antes:**
```prisma
generator client {
    provider = "prisma-client-js"
    binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
    output = "/home/ubuntu/escalafin_mvp/app/node_modules/.prisma/client"  ← PROBLEMÁTICO
}
```

**Después:**
```prisma
generator client {
    provider = "prisma-client-js"
    binaryTargets = ["native", "linux-musl-arm64-openssl-3.0.x"]
}
```

**Cambio aplicado en commit:** `4635923`

---

## 🚀 Instrucciones para Actualizar el Deploy

### Opción A: EasyPanel

1. **Ir a tu proyecto en EasyPanel**
   - URL: https://panel.escala.cloud (o tu panel)
   - Navega a: Projects → escalafin_mvp (o tu nombre de proyecto)

2. **Limpiar caché y reconstruir**
   ```
   Services → [Tu servicio] → Settings → Build
   ```
   - ✓ Clear Build Cache
   - Click: "Rebuild"

3. **Alternativa: Forzar rebuild desde GitHub**
   - En la sección "Source":
   - Verifica que apunta a: `qhosting/escalafinmx` (o el repo que uses)
   - Rama: `main`
   - Click: "Deploy"

### Opción B: Coolify

1. **Ir a tu proyecto en Coolify**
   - Navega a tu aplicación
   - Click en "Deploy"

2. **Force rebuild:**
   ```
   Settings → Build → Clear build cache
   Deployments → Force Deploy
   ```

### Opción C: Deploy Manual con Docker

Si estás usando Docker Compose localmente:

```bash
cd /home/ubuntu/escalafin_mvp

# Limpiar build anterior
docker-compose down
docker system prune -f

# Rebuild y restart
docker-compose build --no-cache
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

---

## 📊 Verificación Post-Deploy

### 1. Verificar que el commit correcto está deployado

En los logs de build de EasyPanel/Coolify, busca:
```
Commit: 4635923
```

### 2. Verificar que Prisma funciona correctamente

En los logs del contenedor, NO debes ver errores como:
```
Error: Cannot find module '/home/ubuntu/escalafin_mvp/...'
```

### 3. Verificar que la aplicación inicia

Logs esperados:
```
✓ Ready in X ms
▲ Next.js 14.2.28
- Local: http://0.0.0.0:3000
```

### 4. Verificar acceso a la aplicación

Abre la URL de tu deploy y verifica:
- ✅ La aplicación carga correctamente
- ✅ Puedes hacer login
- ✅ Los cambios que ves en local ahora aparecen

---

## 🎯 Estado Final

### Repositorios Sincronizados

| Repositorio | Commit | Estado |
|-------------|--------|--------|
| Local | `4635923` | ✅ Actualizado |
| origin (escalafin) | `4635923` | ✅ Sincronizado |
| escalafinmx | `4635923` | ✅ Sincronizado |

### Cambios Aplicados

- ✅ Prisma schema sin rutas absolutas
- ✅ Commits locales subidos a GitHub
- ✅ Ambos repositorios actualizados
- ✅ Listo para rebuild de producción

---

## 🔍 Cómo Prevenir Este Problema

### 1. Siempre verificar sincronización antes de deploy

```bash
# Verificar estado
git status

# Ver commits no subidos
git log origin/main..HEAD --oneline

# Si hay commits sin push:
git push origin main
git push escalafinmx main
```

### 2. Usar el script de sincronización automática

```bash
./scripts/push-ambos-repos.sh "mensaje del commit"
```

Este script:
- ✅ Verifica cambios
- ✅ Crea commit
- ✅ Push a ambos repositorios
- ✅ Verifica sincronización

### 3. Nunca editar manualmente rutas en Prisma

El `output` de Prisma debe:
- ❌ NO tener rutas absolutas como `/home/ubuntu/...`
- ✅ Usar ruta relativa o dejar que Prisma use la default
- ✅ Funcionar tanto en desarrollo como producción

---

## 📋 Checklist de Deploy

Antes de cada deploy, verifica:

- [ ] Todos los cambios están commiteados
  ```bash
  git status
  ```

- [ ] Los commits están en GitHub
  ```bash
  git log origin/main..HEAD
  # Debe estar vacío
  ```

- [ ] Ambos repositorios sincronizados (si usas 2)
  ```bash
  git ls-remote --heads origin
  git ls-remote --heads escalafinmx
  # Deben tener el mismo commit
  ```

- [ ] No hay rutas absolutas en configuración
  ```bash
  grep -r "/home/ubuntu" app/prisma/ app/*.config.* app/*.json
  # No debe encontrar nada relevante
  ```

- [ ] El build local funciona
  ```bash
  cd app && npm run build
  ```

---

## 🆘 Troubleshooting

### El deploy sigue sin mostrar cambios

1. **Verificar que el rebuild se hizo con el commit correcto**
   - Revisa los logs de build
   - Busca el hash del commit: `4635923`

2. **Limpiar caché del navegador**
   - Ctrl+Shift+R (Chrome/Firefox)
   - O usa modo incógnito

3. **Verificar variables de entorno**
   - Asegúrate que `DATABASE_URL`, `NEXTAUTH_URL`, etc. están configuradas
   - En producción deben ser diferentes a las de desarrollo

4. **Revisar logs del contenedor**
   ```bash
   # En EasyPanel/Coolify, ir a:
   Services → [Tu servicio] → Logs
   ```

### Error de Prisma en producción

Si ves errores como:
```
Error: @prisma/client did not initialize yet
```

Solución:
```bash
# En el Dockerfile, asegúrate que se ejecuta:
npx prisma generate
```

---

## 📞 Soporte Adicional

Si después de seguir estos pasos el problema persiste:

1. Verifica los logs del contenedor en EasyPanel/Coolify
2. Confirma que el commit correcto fue deployado
3. Revisa la documentación en:
   - `INSTRUCCIONES_REBUILD_EASYPANEL.md`
   - `DEPLOYMENT_GUIDE.md`

---

**Última actualización:** 29 de Octubre de 2025  
**Commit de fix:** `4635923`  
**Estado:** ✅ Problema resuelto y documentado
