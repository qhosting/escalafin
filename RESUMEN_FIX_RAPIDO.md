
# ⚡ RESUMEN RÁPIDO - Fix Build Error

## 🎯 Problema
Build en Coolify falla con exit code 1 durante instalación de dependencias.

## ✅ Solución
Actualizado `Dockerfile.coolify` para usar **solo NPM** (más estable).

## 🚀 Qué Hacer AHORA

### Paso 1: Push al Repositorio
```bash
cd /home/ubuntu/escalafin_mvp
git add Dockerfile.coolify FIX_BUILD_ERROR_COOLIFY.md
git commit -m "fix: Dockerfile.coolify v11.0 - solo NPM"
git push origin main
```

### Paso 2: Re-deploy en Coolify
1. Ir a **adm.escalafin.com**
2. Seleccionar proyecto EscalaFin
3. Click **"Redeploy"**
4. Verificar logs - debe mostrar: ✅ Dependencias instaladas correctamente

## 📊 Lo Que Se Cambió

**ANTES (fallaba):**
```dockerfile
RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    else \
      npm ci --legacy-peer-deps; \
    fi
```

**DESPUÉS (funciona):**
```dockerfile
RUN npm install --legacy-peer-deps --prefer-offline
```

## 📄 Documentación Completa
Ver: `FIX_BUILD_ERROR_COOLIFY.md` para detalles completos.

---
**Tiempo estimado:** 2-3 minutos para aplicar el fix.
