
#!/bin/bash

# Script para hacer push de los cambios a GitHub
# Fecha: 2025-10-16

set -e

echo "=================================================="
echo "  PUSH DE CAMBIOS A GITHUB - ESCALAFIN MVP"
echo "=================================================="
echo

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: No estamos en un repositorio git${NC}"
    exit 1
fi

echo "📍 Directorio actual: $(pwd)"
echo "📌 Branch actual: $(git branch --show-current)"
echo

# Verificar el estado del repositorio
echo "🔍 Verificando estado del repositorio..."
echo

if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    echo "Archivos modificados:"
    git status --short
    echo
    read -p "¿Deseas agregar y commitear estos cambios? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "📝 Agregando archivos..."
        git add .
        echo
        read -p "Ingresa el mensaje del commit: " commit_msg
        git commit -m "$commit_msg"
        echo -e "${GREEN}✓ Cambios commiteados${NC}"
    else
        echo -e "${RED}✗ Cancelando push${NC}"
        exit 1
    fi
fi

# Obtener información del remote
echo "🌐 Remote configurado:"
git remote -v
echo

# Contar commits pendientes de push
COMMITS_TO_PUSH=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l || echo "0")

if [ "$COMMITS_TO_PUSH" -eq "0" ]; then
    echo -e "${GREEN}✓ Todo está sincronizado con el remote${NC}"
    echo "No hay commits pendientes de push."
    echo
    echo "Últimos 5 commits en el repositorio:"
    git log --oneline -5
    exit 0
fi

# Mostrar commits que se van a pushear
echo -e "${YELLOW}📤 Hay $COMMITS_TO_PUSH commit(s) pendiente(s) de push:${NC}"
echo
git log origin/main..HEAD --oneline --decorate
echo

# Confirmar antes de hacer push
read -p "¿Deseas hacer push de estos commits? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}✗ Push cancelado${NC}"
    exit 1
fi

# Hacer push
echo "🚀 Haciendo push a GitHub..."
echo

if git push origin main; then
    echo
    echo -e "${GREEN}=================================================="
    echo -e "  ✓ PUSH EXITOSO"
    echo -e "==================================================${NC}"
    echo
    echo "📊 Resumen:"
    echo "  • Commits pusheados: $COMMITS_TO_PUSH"
    echo "  • Branch: main"
    echo "  • Remote: origin"
    echo
    echo "🔗 Ver en GitHub:"
    echo "  https://github.com/qhosting/escalafin-mvp"
    echo
else
    echo
    echo -e "${RED}=================================================="
    echo -e "  ✗ ERROR EN PUSH"
    echo -e "==================================================${NC}"
    echo
    echo "Posibles soluciones:"
    echo "  1. Verifica tu autenticación SSH con GitHub"
    echo "  2. Ejecuta: ssh -T git@github.com"
    echo "  3. Si es necesario, configura de nuevo tu SSH key"
    echo "  4. Verifica que tengas permisos de escritura en el repositorio"
    echo
    exit 1
fi
