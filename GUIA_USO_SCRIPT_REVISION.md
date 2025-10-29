
# 📋 Guía de Uso del Script de Revisión de Fixes

## 🎯 Propósito

El script `scripts/revision-fix.sh` es una herramienta automatizada que verifica todos los problemas que hemos corregido durante el desarrollo, previniendo regresiones en futuros cambios.

## 🚀 Uso Rápido

```bash
# Hacer el script ejecutable (solo la primera vez)
chmod +x scripts/revision-fix.sh

# Ejecutar la revisión
./scripts/revision-fix.sh
```

## 📝 ¿Qué Verifica?

### 1. **Rutas Absolutas** ❌→✅
- **Problema**: Rutas absolutas en `schema.prisma` o `next.config.js` causan errores en Docker
- **Verifica**:
  - `output = "/app/..."` en schema.prisma (INCORRECTO)
  - Debe ser: `output = "../node_modules/.prisma/client"` (CORRECTO)
  - `outputFileTracingRoot` en next.config.js

### 2. **Referencias a Yarn** ❌→✅
- **Problema**: El proyecto usa NPM, no Yarn
- **Verifica**:
  - Referencias a `yarn.lock` en Dockerfile
  - Comandos `yarn` en scripts shell
  - Conflictos entre `package-lock.json` y `yarn.lock`

### 3. **Scripts Necesarios** 📜
- **Problema**: Scripts faltantes causan errores en runtime
- **Verifica existencia de**:
  - `app/scripts/setup-users-production.js`
  - `app/scripts/seed.ts`
  - `start-improved.sh`
  - `emergency-start.sh`
  - `healthcheck.sh`

### 4. **.dockerignore Correcto** 🐳
- **Problema**: Archivos críticos excluidos del build
- **Verifica que NO estén excluidos**:
  - `start-improved.sh`
  - `emergency-start.sh`
  - `healthcheck.sh`
  - Carpeta `scripts/`

### 5. **Dependencias Críticas** 📦
- **Problema**: Módulos necesarios no instalados
- **Verifica en package.json**:
  - `bcryptjs`
  - `jsonwebtoken`
  - `next-auth`
  - `@prisma/client`

### 6. **NODE_PATH en Scripts** 🛤️
- **Problema**: Node no encuentra módulos en standalone mode
- **Verifica**:
  - `export NODE_PATH=/app/node_modules` en `start-improved.sh`

### 7. **Estructura Dockerfile** 🏗️
- **Problema**: Dockerfile mal configurado
- **Verifica**:
  - Multi-stage build
  - Copia de carpeta `scripts/`
  - Copia de scripts `.sh`
  - NO copia `yarn.lock`

### 8. **Configuración Prisma** 💎
- **Problema**: Output path incorrecto
- **Verifica**:
  - Ruta relativa en generator
  - No rutas absolutas

### 9. **Variables de Entorno** 🔐
- **Problema**: Variables no documentadas
- **Verifica documentación de**:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

### 10. **Package Manager Consistencia** 📦
- **Problema**: Mezcla de NPM y Yarn
- **Verifica**:
  - Existencia de `package-lock.json`
  - No conflicto con `yarn.lock`

## 📊 Interpretando los Resultados

### ✅ Sin Problemas
```
✨ ¡Todo está en orden! No se encontraron problemas.
Exit code: 0
```

### ⚠️ Con Advertencias
```
⚠️  Se encontraron advertencias pero no errores críticos.
Advertencias encontradas: 2
Exit code: 0
```
**Acción**: Revisar y corregir si es posible, pero no bloquea el deploy.

### ❌ Con Errores
```
❌ Se encontraron errores críticos que deben ser corregidos.
Errores encontrados: 3
Exit code: 1
```
**Acción**: DEBE corregir antes de hacer deploy.

## 🔄 Flujo de Trabajo Recomendado

### Antes de Commit/Push
```bash
# 1. Ejecutar revisión
./scripts/revision-fix.sh

# 2. Si hay errores, corregir
# 3. Ejecutar nuevamente hasta que pase
./scripts/revision-fix.sh

# 4. Commit y push
git add .
git commit -m "Fix: correcciones detectadas por revision-fix.sh"
git push origin main
```

### Antes de Deploy en EasyPanel
```bash
# Verificación final
./scripts/revision-fix.sh

# Si pasa, proceder con deploy
# Si no pasa, NO hacer deploy hasta corregir
```

### Integración con CI/CD
```yaml
# .github/workflows/pre-deploy.yml
jobs:
  check-fixes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Fix Revision
        run: |
          chmod +x scripts/revision-fix.sh
          ./scripts/revision-fix.sh
```

## 🛠️ Correcciones Comunes

### Error: schema.prisma con ruta absoluta
```prisma
// ❌ INCORRECTO
generator client {
  provider = "prisma-client-js"
  output   = "/app/node_modules/.prisma/client"
}

// ✅ CORRECTO
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

### Error: Dockerfile referencia yarn.lock
```dockerfile
# ❌ INCORRECTO
COPY package*.json yarn.lock ./

# ✅ CORRECTO
COPY package*.json ./
```

### Error: Script excluido en .dockerignore
```bash
# ❌ INCORRECTO (.dockerignore)
*.sh

# ✅ CORRECTO (.dockerignore)
# Excluir scripts de desarrollo pero NO de producción
test-*.sh
build-*.sh
```

### Error: NODE_PATH no configurado
```bash
# ❌ INCORRECTO (start-improved.sh)
node app/server.js

# ✅ CORRECTO (start-improved.sh)
export NODE_PATH=/app/node_modules
node app/server.js
```

## 📈 Historial de Fixes Incluidos

| Fix | Fecha | Problema Original | Solución |
|-----|-------|-------------------|----------|
| Ruta absoluta schema.prisma | Oct 28, 2025 | Prisma no genera client en Docker | Usar ruta relativa |
| yarn.lock en Dockerfile | Oct 28, 2025 | Next.js busca yarn.lock | Eliminar referencias a yarn |
| Scripts excluidos | Oct 27, 2025 | Archivos .sh no en container | Actualizar .dockerignore |
| bcryptjs missing | Oct 27, 2025 | Módulo no disponible en runtime | Verificar dependencias |
| NODE_PATH incorrecto | Oct 27, 2025 | Node no encuentra módulos | Configurar NODE_PATH |

## 🎯 Checklist Manual Adicional

Además del script automático, verificar manualmente:

- [ ] Las credenciales de prueba funcionan
- [ ] Los endpoints de API responden
- [ ] El login funciona correctamente
- [ ] Las migraciones de base de datos están aplicadas
- [ ] Los archivos estáticos se cargan correctamente
- [ ] Los logs no muestran errores críticos

## 📞 Soporte

Si el script reporta errores que no entiendes:

1. **Lee el mensaje de error completo**: El script indica ubicación y acción recomendada
2. **Consulta la sección de Correcciones Comunes** arriba
3. **Revisa la documentación técnica** en `DOCUMENTACION_TECNICA_COMPLETA_FINAL.md`
4. **Busca en el historial de commits** para ver cómo se corrigió anteriormente

## 🔄 Actualización del Script

Para añadir nuevas verificaciones al script:

1. Editar `scripts/revision-fix.sh`
2. Añadir nueva sección con formato:
```bash
section "N. Título de la Verificación"
# Lógica de verificación
if [ condición_problema ]; then
    error "Descripción del problema"
else
    success "Verificación pasada"
fi
```
3. Actualizar esta documentación
4. Commit y push

---

**Última actualización**: 29 de Octubre, 2025  
**Versión del script**: 1.0  
**Mantenedor**: Equipo EscalaFin
