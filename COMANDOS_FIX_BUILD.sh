
#!/bin/bash

# Script para aplicar el fix del build error en Coolify
# Fecha: 2025-10-16

echo "🔧 ESCALAFIN - Fix Build Error en Coolify"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile.coolify" ]; then
    echo "❌ Error: No se encuentra Dockerfile.coolify"
    echo "   Asegúrate de ejecutar este script desde /home/ubuntu/escalafin_mvp"
    exit 1
fi

echo -e "${BLUE}1. Verificando cambios en Dockerfile.coolify...${NC}"
git diff Dockerfile.coolify

echo ""
echo -e "${YELLOW}¿Los cambios se ven correctos? (s/n)${NC}"
read -r response

if [[ "$response" != "s" && "$response" != "S" ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo -e "${BLUE}2. Agregando archivos al staging...${NC}"
git add Dockerfile.coolify FIX_BUILD_ERROR_COOLIFY.md COMANDOS_FIX_BUILD.sh

echo ""
echo -e "${BLUE}3. Creando commit...${NC}"
git commit -m "fix: actualizar Dockerfile.coolify a v11.0 (solo NPM, más estable)

- Eliminada lógica condicional Yarn/NPM
- Usar solo NPM con --legacy-peer-deps
- Optimizado cache con --prefer-offline
- Logs mejorados para debugging
- Build más estable y consistente

Fixes build error: exit code 1 durante instalación de dependencias"

echo ""
echo -e "${BLUE}4. Verificando estado...${NC}"
git status

echo ""
echo -e "${BLUE}5. Mostrando último commit...${NC}"
git log -1 --stat

echo ""
echo -e "${GREEN}✅ Cambios listos para push${NC}"
echo ""
echo -e "${YELLOW}Para hacer push al repositorio remoto, ejecuta:${NC}"
echo "   git push origin main"
echo ""
echo -e "${YELLOW}Luego en Coolify:${NC}"
echo "   1. Ir a https://adm.escalafin.com"
echo "   2. Seleccionar el proyecto"
echo "   3. Click en 'Redeploy'"
echo "   4. Verificar logs del build"
echo ""
