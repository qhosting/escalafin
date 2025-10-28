# Fix: Scripts de Producción No Encontrados en Docker

**Error:** `/emergency-start.sh": not found`  
**Fecha:** 28 Octubre 2025  
**Causa Raíz:** `.dockerignore` excluía TODOS los scripts .sh

---

## 🔍 Diagnóstico

### Problema Original

El `.dockerignore` contenía:

```dockerignore
# Scripts
*.sh
test-scripts/
```

Esto excluía **todos** los archivos `.sh` del contexto de Docker, incluyendo:
- ❌ `emergency-start.sh` (necesario para producción)
- ❌ `start-improved.sh` (necesario para producción)
- ❌ `healthcheck.sh` (necesario para producción)

### Error en Runtime

```
/emergency-start.sh": not found
```

Aunque el Dockerfile intentaba copiarlos:

```dockerfile
COPY --chown=nextjs:nodejs start-improved.sh ./start-improved.sh
COPY --chown=nextjs:nodejs emergency-start.sh ./emergency-start.sh
```

Docker no podía encontrarlos porque fueron excluidos por `.dockerignore`.

---

## ✅ Solución Aplicada

### Cambio en `.dockerignore`

**Antes:**
```dockerignore
# Scripts
*.sh
test-scripts/
```

**Después:**
```dockerignore
# Scripts de testing/desarrollo (excluir)
test-scripts/
test-*.sh
deploy-*.sh
build-*.sh
verify-*.sh
diagnostico-*.sh
PROBAR_*.sh
TEST_*.sh
COMANDOS_*.sh
comandos-*.sh
completar-*.sh
fix-*.sh
final-*.sh
push-*.sh
setup-*.sh
coolify-*.sh
backup-*.sh
restore-*.sh

# Scripts de producción (INCLUIR - no excluir)
# start-improved.sh
# emergency-start.sh
# healthcheck.sh
```

### Resultado

- ✅ Scripts de producción INCLUIDOS en Docker build
- ✅ Scripts de testing/desarrollo EXCLUIDOS (reducen tamaño imagen)
- ✅ Selectivo y explícito

---

## 📦 Scripts de Producción

Estos scripts SON necesarios en la imagen Docker:

1. **start-improved.sh**
   - Script principal de inicio
   - Logging detallado
   - Error handling robusto
   - Migraciones y seed

2. **emergency-start.sh**
   - Bypass de checks para debugging
   - Inicio directo de Next.js
   - Omite migraciones/seed

3. **healthcheck.sh**
   - Verificación de salud del contenedor
   - Usado por Docker HEALTHCHECK
   - Detecta si la app está respondiendo

---

## 🧪 Verificación

### En Local

```bash
# Ver qué scripts se incluirían
grep -v '^#' .dockerignore | grep '.sh'

# Los siguientes NO deberían aparecer:
# - start-improved.sh
# - emergency-start.sh
# - healthcheck.sh (aunque se genera inline en Dockerfile)
```

### En Docker Build

```bash
# Build test
docker build -t escalafin-test .

# Verificar scripts dentro de la imagen
docker run --rm escalafin-test ls -la /app/*.sh

# Debería mostrar:
# -rwxr-xr-x ... /app/emergency-start.sh
# -rwxr-xr-x ... /app/healthcheck.sh
# -rwxr-xr-x ... /app/start-improved.sh
```

---

## 🚀 Deploy

### Cambios a Aplicar

```bash
# Commit del fix
git add .dockerignore
git commit -m "fix: Incluir scripts de producción en Docker context

Problema: .dockerignore excluía *.sh, impidiendo que scripts
críticos (emergency-start.sh, start-improved.sh) se copiaran
a la imagen Docker.

Solución: Excluir solo scripts de testing/desarrollo,
permitir scripts de producción.

Fixes: /emergency-start.sh not found error"

# Push a GitHub
git push origin main
```

### En EasyPanel

1. Pull último commit
2. Clear build cache
3. Rebuild
4. Verificar que scripts existan: `ls -la /app/*.sh`
5. Probar inicio: debería usar `start-improved.sh`

---

## 📊 Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| Scripts en imagen | ❌ 0 | ✅ 3 |
| emergency-start | ❌ Not found | ✅ Disponible |
| start-improved | ❌ Not found | ✅ Disponible |
| healthcheck | ⚠️ Inline only | ✅ Disponible |
| Tamaño imagen | Similar | Similar |

---

## ⚠️ Prevención Futura

### Regla

**NUNCA usar `*.sh` en `.dockerignore` a menos que sea absolutamente necesario.**

En su lugar, usar patterns específicos:
- ✅ `test-*.sh` - Scripts de testing
- ✅ `deploy-*.sh` - Scripts de deploy local
- ❌ `*.sh` - Demasiado amplio

### Checklist Pre-Deploy

- [ ] Scripts de producción NO están en `.dockerignore`
- [ ] Scripts tienen permisos ejecutables (755)
- [ ] Dockerfile copia scripts correctamente
- [ ] Scripts existen en repositorio Git

---

## 📝 Archivos Modificados

- ✅ `.dockerignore` - Excluir selectivamente scripts
- ✅ `FIX_DOCKERIGNORE_SCRIPTS.md` (este archivo) - Documentación

---

**Estado:** ✅ Fix aplicado  
**Listo para:** Commit y push a GitHub  
**Próximo:** Rebuild en EasyPanel
