
#!/bin/bash

# Script para convertir yarn.lock de symlink a archivo real
# Previene errores de Docker build

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN_LOCK="$PROJECT_ROOT/app/yarn.lock"

echo "🔍 Verificando yarn.lock..."

if [ -L "$YARN_LOCK" ]; then
    echo "⚠️  ADVERTENCIA: yarn.lock es un symlink"
    echo "📝 Convirtiendo a archivo real..."
    
    # Copiar siguiendo el symlink
    cp -L "$YARN_LOCK" "$YARN_LOCK.tmp"
    
    # Eliminar symlink
    rm "$YARN_LOCK"
    
    # Renombrar a nombre original
    mv "$YARN_LOCK.tmp" "$YARN_LOCK"
    
    # Verificar
    if [ -f "$YARN_LOCK" ] && [ ! -L "$YARN_LOCK" ]; then
        echo "✅ yarn.lock convertido a archivo real"
        ls -lh "$YARN_LOCK"
        exit 0
    else
        echo "❌ ERROR: No se pudo convertir yarn.lock"
        exit 1
    fi
else
    echo "✅ yarn.lock ya es un archivo regular"
    ls -lh "$YARN_LOCK"
    exit 0
fi
