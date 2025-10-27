
#!/bin/bash

# Script para instalar git hooks preventivos

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Instalando Git Hooks preventivos..."
echo ""

# Verificar que estamos en un repositorio git
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ ERROR: No es un repositorio git"
    exit 1
fi

# Crear pre-push hook
PRE_PUSH_HOOK="$GIT_HOOKS_DIR/pre-push"

cat > "$PRE_PUSH_HOOK" << 'EOF'
#!/bin/bash

# Git pre-push hook - Verificar yarn.lock

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT="$PROJECT_ROOT/scripts/pre-push-check.sh"

if [ -f "$SCRIPT" ]; then
    bash "$SCRIPT"
else
    echo "⚠️  Script de verificación no encontrado: $SCRIPT"
    exit 0
fi
EOF

# Hacer ejecutable
chmod +x "$PRE_PUSH_HOOK"

echo "✅ Pre-push hook instalado en: $PRE_PUSH_HOOK"
echo ""

# Hacer ejecutables los scripts
chmod +x "$PROJECT_ROOT/scripts/fix-yarn-lock-symlink.sh"
chmod +x "$PROJECT_ROOT/scripts/pre-push-check.sh"

echo "✅ Scripts hechos ejecutables"
echo ""
echo "📋 Git hooks instalados:"
echo "   - pre-push: Verifica yarn.lock antes de cada push"
echo ""
echo "🎯 Ahora cada vez que hagas 'git push', se verificará automáticamente"
echo "   que yarn.lock no sea un symlink."
echo ""
echo "Para probar manualmente:"
echo "   ./scripts/pre-push-check.sh"
echo ""

exit 0
