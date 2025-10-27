
#!/bin/bash

# Git pre-push hook para verificar yarn.lock antes de push
# Previene pushes con yarn.lock como symlink

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN_LOCK="$PROJECT_ROOT/app/yarn.lock"

echo ""
echo "🔍 Verificación pre-push..."
echo ""

# Verificar si yarn.lock existe
if [ ! -e "$YARN_LOCK" ]; then
    echo "⚠️  ADVERTENCIA: yarn.lock no existe"
    echo "   Ubicación esperada: $YARN_LOCK"
    echo ""
    read -p "¿Deseas continuar con el push? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Push cancelado"
        exit 1
    fi
fi

# Verificar si es symlink
if [ -L "$YARN_LOCK" ]; then
    echo "❌ ERROR CRÍTICO: yarn.lock es un symlink"
    echo ""
    echo "   Docker no puede copiar symlinks durante el build."
    echo "   Esto causará un error en EasyPanel/Coolify/Docker."
    echo ""
    echo "🔧 SOLUCIÓN AUTOMÁTICA:"
    echo ""
    
    # Ofrecer conversión automática
    read -p "¿Deseas convertir yarn.lock a archivo real automáticamente? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo ""
        echo "Para convertirlo manualmente:"
        echo "  cd $PROJECT_ROOT/app"
        echo "  cp -L yarn.lock yarn.lock.tmp"
        echo "  rm yarn.lock"
        echo "  mv yarn.lock.tmp yarn.lock"
        echo "  git add yarn.lock"
        echo ""
        echo "O ejecuta: ./scripts/fix-yarn-lock-symlink.sh"
        echo ""
        exit 1
    fi
    
    # Convertir automáticamente
    echo ""
    echo "🔧 Convirtiendo yarn.lock..."
    
    if bash "$PROJECT_ROOT/scripts/fix-yarn-lock-symlink.sh"; then
        echo ""
        echo "✅ yarn.lock convertido exitosamente"
        echo ""
        echo "⚠️  IMPORTANTE: Debes agregar el cambio antes de push:"
        echo "   git add app/yarn.lock"
        echo "   git commit -m 'fix: Convertir yarn.lock a archivo regular'"
        echo ""
        exit 1
    else
        echo ""
        echo "❌ ERROR: No se pudo convertir yarn.lock automáticamente"
        echo "   Por favor, conviértelo manualmente"
        echo ""
        exit 1
    fi
else
    echo "✅ yarn.lock es un archivo regular"
    
    # Verificar tamaño (debe ser > 100KB normalmente)
    SIZE=$(stat -f%z "$YARN_LOCK" 2>/dev/null || stat -c%s "$YARN_LOCK" 2>/dev/null || echo "0")
    SIZE_KB=$((SIZE / 1024))
    
    if [ "$SIZE" -lt 10000 ]; then
        echo "⚠️  ADVERTENCIA: yarn.lock parece muy pequeño (${SIZE_KB}KB)"
        echo "   Verifica que sea válido"
    else
        echo "   Tamaño: ${SIZE_KB}KB ✓"
    fi
fi

echo ""
echo "✅ Verificaciones completadas - OK para push"
echo ""

exit 0
