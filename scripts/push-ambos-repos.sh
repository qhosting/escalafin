
#!/bin/bash

# Script para push a ambos repositorios GitHub
# Uso: ./scripts/push-ambos-repos.sh [branch] [mensaje]

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parámetros
BRANCH="${1:-main}"
FORCE="${2:-}"

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PUSH A AMBOS REPOSITORIOS GITHUB${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Error: No se encontró el directorio .git${NC}"
    echo "Este script debe ejecutarse desde la raíz del repositorio"
    exit 1
fi

# Mostrar status
echo -e "${BLUE}📊 Estado actual:${NC}"
git status --short
echo ""

# Verificar si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    echo "Por favor, haz commit de tus cambios antes de ejecutar este script"
    exit 1
fi

# Push a origin
echo -e "${BLUE}→ Pushing a origin (github.com/qhosting/escalafin)...${NC}"
if [ "$FORCE" == "--force" ]; then
    git push origin "$BRANCH" --force
else
    git push origin "$BRANCH"
fi
echo -e "${GREEN}✅ Push a origin completado${NC}"
echo ""

# Push a escalafinmx
echo -e "${BLUE}→ Pushing a escalafinmx (github.com/qhosting/escalafinmx)...${NC}"
if [ "$FORCE" == "--force" ]; then
    git push escalafinmx "$BRANCH" --force
else
    git push escalafinmx "$BRANCH"
fi
echo -e "${GREEN}✅ Push a escalafinmx completado${NC}"
echo ""

# Verificar sincronización
echo -e "${BLUE}🔍 Verificando sincronización...${NC}"
git fetch --all > /dev/null 2>&1
DIFF=$(git log origin/main..escalafinmx/main --oneline)

if [ -z "$DIFF" ]; then
    echo -e "${GREEN}✅ Repositorios sincronizados correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  Diferencias encontradas entre repositorios:${NC}"
    echo "$DIFF"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ PUSH COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Mostrar último commit
echo -e "${BLUE}Último commit:${NC}"
git log --oneline -1
echo ""

# Mostrar URLs de los repositorios
echo -e "${BLUE}Repositorios actualizados:${NC}"
echo "  • https://github.com/qhosting/escalafin"
echo "  • https://github.com/qhosting/escalafinmx"
echo ""

exit 0
