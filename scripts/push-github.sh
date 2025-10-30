#!/bin/bash

# Script para push al repositorio GitHub (escalafin)
# Uso: ./scripts/push-github.sh [branch]

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
echo -e "${BLUE}  PUSH A REPOSITORIO GITHUB${NC}"
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
echo -e "${GREEN}✅ Push completado${NC}"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ PUSH COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Mostrar último commit
echo -e "${BLUE}Último commit:${NC}"
git log --oneline -1
echo ""

# Mostrar URL del repositorio
echo -e "${BLUE}Repositorio actualizado:${NC}"
echo "  • https://github.com/qhosting/escalafin"
echo ""

exit 0
