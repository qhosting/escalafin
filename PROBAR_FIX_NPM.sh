
#!/bin/bash

# 🧪 Script de Prueba: Fix npm lockfileVersion 3
# Versión: 1.0
# Fecha: 2025-10-16

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 PROBANDO FIX: npm lockfileVersion 3                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: No se encuentra el Dockerfile${NC}"
    echo "   Ejecuta este script desde /home/ubuntu/escalafin_mvp"
    exit 1
fi

# Verificar lockfileVersion
echo -e "${YELLOW}→ Verificando lockfileVersion...${NC}"
LOCKFILE_VERSION=$(cat app/package-lock.json | jq -r '.lockfileVersion' 2>/dev/null || echo "error")

if [ "$LOCKFILE_VERSION" = "error" ]; then
    echo -e "${RED}❌ Error: No se puede leer package-lock.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ lockfileVersion detectado: ${LOCKFILE_VERSION}${NC}"

if [ "$LOCKFILE_VERSION" = "3" ]; then
    echo -e "${BLUE}   ℹ️  lockfileVersion 3 requiere npm >= 7${NC}"
fi

echo ""

# Verificar Docker
echo -e "${YELLOW}→ Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está instalado${NC}"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✅ Docker encontrado: ${DOCKER_VERSION}${NC}"
echo ""

# Verificar Dockerfile v14.0
echo -e "${YELLOW}→ Verificando versión del Dockerfile...${NC}"
DOCKERFILE_VERSION=$(grep "Versión: " Dockerfile | head -n 1 | sed 's/.*Versión: //' | sed 's/ .*//')
echo -e "${GREEN}✅ Dockerfile versión: ${DOCKERFILE_VERSION}${NC}"

if [[ "$DOCKERFILE_VERSION" < "14.0" ]]; then
    echo -e "${RED}❌ Error: Se requiere Dockerfile v14.0 o superior${NC}"
    exit 1
fi

echo ""

# Build de prueba
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🏗️  Iniciando Build de Prueba                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}→ Construyendo imagen (esto puede tardar 5-10 minutos)...${NC}"
echo ""

# Build con progreso detallado
if docker build --progress=plain -t escalafin-test . 2>&1 | tee /tmp/docker-build.log; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ BUILD EXITOSO                                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Verificar npm en la imagen
    echo -e "${YELLOW}→ Verificando versión de npm en la imagen...${NC}"
    NPM_VERSION=$(docker run --rm escalafin-test npm --version)
    echo -e "${GREEN}✅ npm versión en Docker: ${NPM_VERSION}${NC}"
    
    if [[ "${NPM_VERSION%%.*}" -ge 9 ]]; then
        echo -e "${GREEN}✅ npm >= 9 detectado (compatible con lockfileVersion 3)${NC}"
    else
        echo -e "${YELLOW}⚠️  npm < 9 detectado (puede tener problemas con lockfileVersion 3)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Puedes proceder con:"
    echo -e "  • Push a GitHub"
    echo -e "  • Deploy a Coolify"
    echo -e "  • Build en GitHub Actions"
    echo ""
    
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ BUILD FALLÓ                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${YELLOW}Últimas 30 líneas del log:${NC}"
    tail -n 30 /tmp/docker-build.log
    
    echo ""
    echo -e "${RED}❌ El build falló. Revisa los errores arriba.${NC}"
    echo ""
    echo -e "Logs completos en: /tmp/docker-build.log"
    echo ""
    
    exit 1
fi
