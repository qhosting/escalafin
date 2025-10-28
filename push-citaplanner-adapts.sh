#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 SUBIENDO ADAPTACIONES DE CITAPLANNER A GITHUB"
echo "═══════════════════════════════════════════════════════════════════"

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo "❌ ERROR: No se encuentra el repositorio git"
    exit 1
fi

# Mostrar estado actual
echo ""
echo "📊 Estado actual del repositorio:"
git status --short

# Agregar los nuevos archivos
echo ""
echo "📦 Agregando archivos adaptados..."
git add emergency-start.sh
git add docker-compose.easypanel.yml
git add verify-build.sh
git add start-improved.sh
git add RESUMEN_ARCHIVOS_CITAPLANNER.txt

# Verificar cambios
echo ""
echo "📋 Cambios a commitear:"
git status --short

# Crear commit
echo ""
echo "💾 Creando commit..."
git commit -m "feat: Adaptar scripts útiles de CitaPlanner

- emergency-start.sh: Bypass de checks para debug rápido
- start-improved.sh: Inicio mejorado con mejor detección de errores
- docker-compose.easypanel.yml: Config específica EasyPanel
- verify-build.sh: Verificación completa de build
- RESUMEN_ARCHIVOS_CITAPLANNER.txt: Análisis técnico

Adaptado de https://github.com/qhosting/citaplanner" || echo "⚠️  No hay cambios para commitear"

# Push a GitHub
echo ""
echo "🚀 Haciendo push a GitHub..."
git push origin main

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ CAMBIOS SUBIDOS EXITOSAMENTE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📦 Archivos agregados:"
echo "  - emergency-start.sh"
echo "  - start-improved.sh"
echo "  - verify-build.sh"
echo "  - docker-compose.easypanel.yml"
echo "  - RESUMEN_ARCHIVOS_CITAPLANNER.txt"
echo ""
