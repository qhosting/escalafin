
#!/bin/bash

# 🧪 TEST_DOCKERFILE_BUILD.sh
# Script para probar el build del Dockerfile localmente
# Versión: 1.0

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
VERBOSE=false
NO_CACHE=false
IMAGE_NAME="escalafin-test"
IMAGE_TAG="latest"

# Función de ayuda
show_help() {
    cat << EOF
🧪 Test Dockerfile Build Script

Uso: $0 [opciones]

Opciones:
    -h, --help          Mostrar esta ayuda
    -v, --verbose       Modo verbose (logs detallados)
    -n, --no-cache      Build sin cache
    -t, --tag TAG       Tag personalizado (default: latest)

Ejemplos:
    $0                      # Build normal
    $0 --verbose            # Build con logs
    $0 --no-cache           # Build desde cero
    $0 --tag v13.0          # Build con tag específico

EOF
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -n|--no-cache)
            NO_CACHE=true
            shift
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}❌ Opción desconocida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 Test Dockerfile Build - EscalaFin ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo

# 1. Verificar que estamos en el directorio correcto
echo -e "${BLUE}📍 Verificando directorio...${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: No se encuentra Dockerfile${NC}"
    echo -e "${YELLOW}💡 Ejecuta este script desde: /home/ubuntu/escalafin_mvp${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Directorio correcto${NC}"
echo

# 2. Verificar archivos necesarios
echo -e "${BLUE}📦 Verificando archivos necesarios...${NC}"

FILES_TO_CHECK=(
    "app/package.json"
    "app/prisma/schema.prisma"
    "app/next.config.js"
)

ALL_FILES_OK=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (NO ENCONTRADO)${NC}"
        ALL_FILES_OK=false
    fi
done

# Verificar lockfiles (opcional)
echo
echo -e "${YELLOW}📋 Lockfiles (opcionales):${NC}"
if [ -f "app/package-lock.json" ]; then
    SIZE=$(du -h "app/package-lock.json" | cut -f1)
    echo -e "${GREEN}✅ package-lock.json ($SIZE)${NC}"
    
    # Verificar que no sea symlink
    if [ -L "app/package-lock.json" ]; then
        echo -e "${RED}⚠️  Es un symlink - puede causar problemas${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  package-lock.json no encontrado (se generará durante build)${NC}"
fi

if [ -f "app/yarn.lock" ]; then
    SIZE=$(du -h "app/yarn.lock" | cut -f1)
    echo -e "${BLUE}ℹ️  yarn.lock ($SIZE)${NC}"
fi

if [ "$ALL_FILES_OK" = false ]; then
    echo
    echo -e "${RED}❌ Faltan archivos necesarios${NC}"
    exit 1
fi
echo

# 3. Verificar Docker
echo -e "${BLUE}🐳 Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado o no está en PATH${NC}"
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✅ $DOCKER_VERSION${NC}"
echo

# 4. Preparar comando de build
echo -e "${BLUE}🏗️  Preparando build...${NC}"

BUILD_CMD="docker build"

if [ "$NO_CACHE" = true ]; then
    BUILD_CMD="$BUILD_CMD --no-cache"
    echo -e "${YELLOW}📝 Build sin cache activado${NC}"
fi

BUILD_CMD="$BUILD_CMD -t ${IMAGE_NAME}:${IMAGE_TAG}"
BUILD_CMD="$BUILD_CMD ."

echo -e "${BLUE}📝 Comando: $BUILD_CMD${NC}"
echo

# 5. Ejecutar build
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚀 Iniciando Docker Build       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo

START_TIME=$(date +%s)

if [ "$VERBOSE" = true ]; then
    # Build con logs completos
    $BUILD_CMD 2>&1 | tee build.log
    BUILD_EXIT_CODE=${PIPESTATUS[0]}
else
    # Build con progreso
    $BUILD_CMD
    BUILD_EXIT_CODE=$?
fi

END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))

echo

# 6. Verificar resultado
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       ✅ BUILD EXITOSO ✅              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo
    
    echo -e "${BLUE}📊 Estadísticas del Build:${NC}"
    echo -e "  ⏱️  Duración: ${BUILD_DURATION}s"
    
    # Tamaño de la imagen
    IMAGE_SIZE=$(docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "{{.Size}}")
    echo -e "  💾 Tamaño imagen: $IMAGE_SIZE"
    
    # Layers
    LAYERS=$(docker history ${IMAGE_NAME}:${IMAGE_TAG} --no-trunc | wc -l)
    echo -e "  📦 Layers: $LAYERS"
    
    echo
    
    # 7. Test rápido: Intentar iniciar contenedor
    echo -e "${BLUE}🧪 Test rápido: Iniciando contenedor...${NC}"
    
    CONTAINER_ID=$(docker run -d --rm \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        -e NEXTAUTH_URL="http://localhost:3000" \
        -e NEXTAUTH_SECRET="test-secret" \
        ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || echo "")
    
    if [ -n "$CONTAINER_ID" ]; then
        sleep 3
        
        # Verificar que esté corriendo
        if docker ps | grep -q "$CONTAINER_ID"; then
            echo -e "${GREEN}✅ Contenedor inició correctamente${NC}"
            
            # Ver logs
            echo -e "${BLUE}📋 Primeras líneas de logs:${NC}"
            docker logs "$CONTAINER_ID" 2>&1 | head -10
            
            # Detener
            docker stop "$CONTAINER_ID" > /dev/null 2>&1
        else
            echo -e "${YELLOW}⚠️  Contenedor detenido inesperadamente${NC}"
            echo -e "${BLUE}📋 Logs del contenedor:${NC}"
            docker logs "$CONTAINER_ID" 2>&1
        fi
    else
        echo -e "${YELLOW}⚠️  No se pudo iniciar contenedor de prueba${NC}"
        echo -e "${YELLOW}   (Esto es normal si no hay DB disponible)${NC}"
    fi
    
    echo
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           🎉 TEST COMPLETO 🎉          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo
    
    echo -e "${BLUE}🎯 Próximos pasos:${NC}"
    echo -e "  1. Commit y push a GitHub:"
    echo -e "     ${YELLOW}git add .${NC}"
    echo -e "     ${YELLOW}git commit -m 'fix: Dockerfile v13.0'${NC}"
    echo -e "     ${YELLOW}git push origin main${NC}"
    echo
    echo -e "  2. Verificar GitHub Actions:"
    echo -e "     ${BLUE}https://github.com/qhosting/escalafin-mvp/actions${NC}"
    echo
    echo -e "  3. Deploy a producción"
    echo
    
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}📄 Log completo guardado en: build.log${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║         ❌ BUILD FALLÓ ❌              ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    echo
    
    echo -e "${RED}❌ El build falló después de ${BUILD_DURATION}s${NC}"
    echo
    
    echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
    echo
    echo -e "  1. Ver logs completos:"
    echo -e "     ${YELLOW}./TEST_DOCKERFILE_BUILD.sh --verbose${NC}"
    echo
    echo -e "  2. Build sin cache:"
    echo -e "     ${YELLOW}./TEST_DOCKERFILE_BUILD.sh --no-cache${NC}"
    echo
    echo -e "  3. Verificar package-lock.json:"
    echo -e "     ${YELLOW}cd app && rm package-lock.json && npm install --package-lock-only${NC}"
    echo
    echo -e "  4. Ver documentación:"
    echo -e "     ${YELLOW}cat FIX_DOCKERFILE_NPM_CI.md${NC}"
    echo
    
    if [ "$VERBOSE" = true ] && [ -f "build.log" ]; then
        echo -e "${BLUE}📄 Log completo guardado en: build.log${NC}"
        echo -e "${BLUE}Ver últimas líneas del error:${NC}"
        echo
        tail -30 build.log
    fi
    
    exit 1
fi
