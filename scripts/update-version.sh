
#!/bin/bash

##############################################################################
# Script para actualizar la versión del proyecto EscalaFin MVP
# Uso: ./scripts/update-version.sh [major|minor|patch] "Descripción del release"
##############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar uso
show_usage() {
    echo -e "${BLUE}Uso:${NC}"
    echo "  $0 [major|minor|patch] \"Descripción del release\""
    echo ""
    echo -e "${BLUE}Ejemplos:${NC}"
    echo "  $0 patch \"Fix de bugs críticos\""
    echo "  $0 minor \"Nuevas funcionalidades de reportes\""
    echo "  $0 major \"Cambios importantes en la arquitectura\""
    echo ""
    exit 1
}

# Verificar argumentos
if [ "$#" -lt 2 ]; then
    echo -e "${RED}Error: Se requieren 2 argumentos${NC}"
    show_usage
fi

VERSION_TYPE=$1
RELEASE_DESCRIPTION=$2

# Validar tipo de versión
if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Tipo de versión inválido. Usa: major, minor o patch${NC}"
    show_usage
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       ACTUALIZACIÓN DE VERSIÓN - EscalaFin MVP            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ir al directorio del proyecto
cd "$(dirname "$0")/.."

# Obtener versión actual
CURRENT_VERSION=$(cat VERSION)
echo -e "${YELLOW}Versión actual:${NC} $CURRENT_VERSION"

# Actualizar versión en package.json
echo -e "\n${BLUE}📦 Actualizando package.json...${NC}"
cd app
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
cd ..

echo -e "${GREEN}✅ Nueva versión:${NC} $NEW_VERSION"

# Quitar la 'v' del inicio
NEW_VERSION=${NEW_VERSION#v}

# Actualizar VERSION
echo "$NEW_VERSION" > VERSION
echo -e "${GREEN}✅ Actualizado VERSION${NC}"

# Generar build number
BUILD_NUMBER=$(date +%Y%m%d).001
RELEASE_DATE=$(date +%Y-%m-%d)
GIT_COMMIT=$(git rev-parse --short HEAD)

# Actualizar version.json (raíz)
cat > version.json << EOF
{
  "version": "$NEW_VERSION",
  "buildNumber": "$BUILD_NUMBER",
  "releaseDate": "$RELEASE_DATE",
  "releaseName": "$RELEASE_DESCRIPTION",
  "gitCommit": "$GIT_COMMIT",
  "environment": "production",
  "changelog": [
    "$RELEASE_DESCRIPTION"
  ],
  "compatibility": {
    "node": "18.x",
    "npm": "9.x",
    "nextjs": "14.2.28",
    "prisma": "6.7.0",
    "docker": ">=20.10"
  },
  "deployments": {
    "docker": "compatible",
    "easypanel": "compatible",
    "coolify": "compatible",
    "kubernetes": "compatible"
  }
}
EOF

# Copiar a app/
cp version.json app/version.json
echo -e "${GREEN}✅ Actualizado version.json${NC}"

# Agregar entrada al CHANGELOG
echo -e "\n${BLUE}📝 Actualizando CHANGELOG.md...${NC}"

# Crear entrada temporal
TEMP_ENTRY=$(cat << EOF

## [$NEW_VERSION] - $RELEASE_DATE

### Cambios

- $RELEASE_DESCRIPTION

**Commit:** \`$GIT_COMMIT\`  
**Build:** \`$BUILD_NUMBER\`

EOF
)

# Insertar después de la primera línea de "---"
awk -v entry="$TEMP_ENTRY" '
/^---$/ && !found {
    print
    print entry
    found=1
    next
}
{print}
' CHANGELOG.md > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md

echo -e "${GREEN}✅ Actualizado CHANGELOG.md${NC}"

# Mostrar resumen
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMEN                                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Versión:${NC} $NEW_VERSION"
echo -e "${YELLOW}Build:${NC} $BUILD_NUMBER"
echo -e "${YELLOW}Fecha:${NC} $RELEASE_DATE"
echo -e "${YELLOW}Commit:${NC} $GIT_COMMIT"
echo -e "${YELLOW}Descripción:${NC} $RELEASE_DESCRIPTION"
echo ""

# Preguntar si hacer commit
echo -e "${YELLOW}¿Deseas crear un commit con estos cambios? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}📝 Creando commit...${NC}"
    git add VERSION version.json app/version.json app/package.json app/package-lock.json CHANGELOG.md
    git commit -m "🔖 Release v$NEW_VERSION: $RELEASE_DESCRIPTION"
    echo -e "${GREEN}✅ Commit creado${NC}"
    
    echo -e "\n${YELLOW}¿Deseas crear un tag? (y/n)${NC}"
    read -r tag_response
    
    if [[ "$tag_response" =~ ^[Yy]$ ]]; then
        git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION: $RELEASE_DESCRIPTION"
        echo -e "${GREEN}✅ Tag v$NEW_VERSION creado${NC}"
        
        echo -e "\n${YELLOW}Recuerda hacer push con:${NC}"
        echo -e "  git push origin main"
        echo -e "  git push origin v$NEW_VERSION"
    fi
else
    echo -e "${YELLOW}ℹ️  Commit no creado. Archivos modificados:${NC}"
    git status --short | grep -E "(VERSION|version.json|package.json|CHANGELOG)"
fi

echo ""
echo -e "${GREEN}✅ Actualización de versión completada${NC}"
echo ""
