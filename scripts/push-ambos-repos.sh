
#!/bin/bash

# 🔄 Script para hacer push a ambos repositorios simultáneamente
# EscalaFin MVP - Sincronización de repos
# Uso: ./push-ambos-repos.sh "mensaje del commit"

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}  🔄 PUSH A AMBOS REPOSITORIOS - ESCALAFIN${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: No estás en el directorio raíz del repositorio git${NC}"
    exit 1
fi

# Verificar que se pasó un mensaje de commit
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  No se proporcionó mensaje de commit${NC}"
    echo -e "${BLUE}💡 Uso: $0 \"mensaje del commit\"${NC}"
    echo ""
    echo "Ejemplo:"
    echo "  $0 \"Fix: Corregir validación de formularios\""
    echo ""
    exit 1
fi

COMMIT_MESSAGE="$1"

# Verificar estado del repositorio
echo -e "${BLUE}📊 Verificando estado del repositorio...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  No hay cambios para commitear${NC}"
    echo ""
    read -p "¿Deseas hacer push de los commits existentes? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Operación cancelada${NC}"
        exit 1
    fi
    SKIP_COMMIT=true
else
    echo -e "${GREEN}✅ Hay cambios para commitear${NC}"
    echo ""
    git status --short
    echo ""
    SKIP_COMMIT=false
fi

# Hacer commit si hay cambios
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "${BLUE}📝 Agregando cambios al stage...${NC}"
    git add .
    echo -e "${GREEN}✅ Cambios agregados${NC}"
    echo ""

    echo -e "${BLUE}💾 Creando commit...${NC}"
    git commit -m "$COMMIT_MESSAGE"
    echo -e "${GREEN}✅ Commit creado${NC}"
    echo ""
fi

# Obtener el hash del último commit
COMMIT_HASH=$(git log -1 --format="%h")
COMMIT_FULL=$(git log -1 --format="%H")

echo -e "${BLUE}📌 Último commit: ${YELLOW}${COMMIT_HASH}${NC}"
echo -e "${BLUE}📄 Mensaje: ${NC}\"$(git log -1 --format="%s")\""
echo ""

# Verificar que los remotes existen
echo -e "${BLUE}🔍 Verificando remotes configurados...${NC}"
if ! git remote | grep -q "^origin$"; then
    echo -e "${RED}❌ Error: Remote 'origin' no está configurado${NC}"
    exit 1
fi
if ! git remote | grep -q "^escalafinmx$"; then
    echo -e "${RED}❌ Error: Remote 'escalafinmx' no está configurado${NC}"
    echo ""
    echo -e "${YELLOW}💡 Configúralo con:${NC}"
    echo "   git remote add escalafinmx https://github.com/qhosting/escalafinmx.git"
    exit 1
fi
echo -e "${GREEN}✅ Remotes configurados correctamente${NC}"
echo ""

# Push a origin
echo "───────────────────────────────────────────────────────────────"
echo -e "${BLUE}🚀 Pushing a 'origin' (escalafin)...${NC}"
echo "───────────────────────────────────────────────────────────────"
if git push origin main; then
    echo -e "${GREEN}✅ Push a 'origin' exitoso${NC}"
else
    echo -e "${RED}❌ Error en push a 'origin'${NC}"
    exit 1
fi
echo ""

# Push a escalafinmx
echo "───────────────────────────────────────────────────────────────"
echo -e "${BLUE}🚀 Pushing a 'escalafinmx'...${NC}"
echo "───────────────────────────────────────────────────────────────"
if git push escalafinmx main; then
    echo -e "${GREEN}✅ Push a 'escalafinmx' exitoso${NC}"
else
    echo -e "${RED}❌ Error en push a 'escalafinmx'${NC}"
    echo -e "${YELLOW}⚠️  'origin' fue actualizado pero 'escalafinmx' falló${NC}"
    exit 1
fi
echo ""

# Verificación final
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  ✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo -e "   Commit: ${YELLOW}${COMMIT_HASH}${NC}"
echo -e "   Repositorios actualizados:"
echo -e "     ✓ origin (https://github.com/qhosting/escalafin)"
echo -e "     ✓ escalafinmx (https://github.com/qhosting/escalafinmx)"
echo ""
echo -e "${GREEN}🎉 Ambos repositorios están sincronizados${NC}"
echo ""
