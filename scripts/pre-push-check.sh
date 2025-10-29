
#!/bin/bash

# Git pre-push hook para verificar lockfiles antes de push
# Previene pushes con yarn.lock como symlink
# Soporta tanto Yarn (yarn.lock) como NPM (package-lock.json)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN_LOCK="$PROJECT_ROOT/app/yarn.lock"
NPM_LOCK="$PROJECT_ROOT/app/package-lock.json"

echo ""
echo "🔍 Verificación pre-push..."
echo ""

# Verificar qué gestor de paquetes se está usando
if [ -f "$NPM_LOCK" ]; then
    echo "✅ Proyecto usa NPM (package-lock.json detectado)"
    LOCKFILE="$NPM_LOCK"
    LOCKFILE_NAME="package-lock.json"
elif [ -f "$YARN_LOCK" ]; then
    echo "✅ Proyecto usa Yarn (yarn.lock detectado)"
    LOCKFILE="$YARN_LOCK"
    LOCKFILE_NAME="yarn.lock"
else
    echo "⚠️  ADVERTENCIA: No se encontró lockfile (ni yarn.lock ni package-lock.json)"
    echo "   Ubicaciones esperadas:"
    echo "     - $YARN_LOCK"
    echo "     - $NPM_LOCK"
    echo ""
    read -p "¿Deseas continuar con el push? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Push cancelado"
        exit 1
    fi
    exit 0
fi

# Si es yarn.lock, verificar que no sea symlink
if [ "$LOCKFILE_NAME" = "yarn.lock" ]; then
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
    fi
fi

# Verificar que el lockfile no sea symlink (aplica a ambos)
if [ -L "$LOCKFILE" ]; then
    echo "❌ ERROR: $LOCKFILE_NAME es un symlink"
    echo "   Docker no puede copiar symlinks"
    exit 1
fi

echo "✅ $LOCKFILE_NAME es un archivo regular"

# Verificar tamaño del lockfile
SIZE=$(stat -f%z "$LOCKFILE" 2>/dev/null || stat -c%s "$LOCKFILE" 2>/dev/null || echo "0")
SIZE_KB=$((SIZE / 1024))

if [ "$SIZE" -lt 10000 ]; then
    echo "⚠️  ADVERTENCIA: $LOCKFILE_NAME parece muy pequeño (${SIZE_KB}KB)"
    echo "   Verifica que sea válido"
else
    echo "   Tamaño: ${SIZE_KB}KB ✓"
fi

# Validar rutas absolutas problemáticas
echo ""
echo "🔍 Validando rutas absolutas..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/validate-absolute-paths.sh" ]; then
    if bash "$SCRIPT_DIR/validate-absolute-paths.sh" > /dev/null 2>&1; then
        echo "✅ Sin rutas absolutas problemáticas"
    else
        echo "⚠️  Se encontraron rutas absolutas problemáticas"
        echo "   Ejecuta: bash scripts/validate-absolute-paths.sh"
        echo "   Para ver detalles"
        echo ""
        read -p "¿Deseas continuar con el push de todas formas? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Push cancelado"
            exit 1
        fi
    fi
else
    echo "⚠️  validate-absolute-paths.sh no encontrado, saltando validación"
fi

echo ""
echo "✅ Verificaciones completadas - OK para push"
echo ""

exit 0
