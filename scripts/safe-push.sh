
#!/bin/bash

# Script seguro para hacer push con verificaciones automáticas

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ""
echo "🚀 Push Seguro con Verificaciones Automáticas"
echo "=============================================="
echo ""

# 1. Verificar estado de git
echo "📊 1. Verificando estado de git..."
cd "$PROJECT_ROOT"

if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Hay cambios sin commitear:"
    echo ""
    git status --short
    echo ""
    read -p "¿Deseas agregar y commitear todos los cambios? (Y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        read -p "Mensaje del commit: " COMMIT_MSG
        git add -A
        git commit -m "$COMMIT_MSG"
        echo "✅ Cambios commiteados"
    fi
else
    echo "✅ No hay cambios pendientes"
fi

echo ""

# 2. Verificar yarn.lock
echo "🔍 2. Verificando yarn.lock..."
bash "$PROJECT_ROOT/scripts/pre-push-check.sh"

# Si pre-push-check devuelve error, preguntar si continuar
if [ $? -ne 0 ]; then
    echo ""
    read -p "¿Deseas continuar con el push de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Push cancelado"
        exit 1
    fi
fi

echo ""

# 3. Pull antes de push (evitar conflictos)
echo "⬇️  3. Sincronizando con remoto (pull)..."
git pull origin main --rebase || {
    echo "⚠️  Hubo conflictos al hacer pull"
    echo "   Resuelve los conflictos y vuelve a ejecutar este script"
    exit 1
}

echo ""

# 4. Push
echo "⬆️  4. Haciendo push..."

# Usar el token si está disponible
if [ -n "$GITHUB_TOKEN" ]; then
    git push https://GITHUB_TOKEN:${GITHUB_TOKEN}@github.com/qhosting/escalafin-mvp.git main
else
    git push origin main
fi

echo ""
echo "✅ Push completado exitosamente"
echo ""

# 5. Mostrar último commit
echo "📝 Último commit:"
git log -1 --oneline
echo ""

exit 0
