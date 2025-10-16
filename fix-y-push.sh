#!/bin/bash
# Script rápido para aplicar fix y hacer push

echo "🔧 Aplicando fix de Dockerfile.coolify..."
cd /home/ubuntu/escalafin_mvp

# Agregar archivos
git add Dockerfile.coolify FIX_BUILD_ERROR_COOLIFY.md COMANDOS_FIX_BUILD.sh RESUMEN_FIX_RAPIDO.md fix-y-push.sh

# Commit
git commit -m "fix: Dockerfile.coolify v11.0 - usar solo NPM para estabilidad

- Eliminada lógica condicional Yarn/NPM
- Solo NPM con flags optimizados
- Logs mejorados para debugging
- Soluciona exit code 1 en build"

# Mostrar estado
echo ""
echo "✅ Commit creado. Para hacer push ejecuta:"
echo "   git push origin main"
echo ""
echo "Luego re-deploy en Coolify."
