
#!/bin/bash

# Script de prueba rápida del Docker build
# Versión: 1.0
# Fecha: 2025-10-16

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       ESCALAFIN MVP - TEST DE BUILD DOCKER RÁPIDO            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para logs
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ] || [ ! -f "Dockerfile.simple" ]; then
    log_error "No se encontraron los Dockerfiles. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "PASO 1: Verificar prerrequisitos"
echo "═══════════════════════════════════════════════════════════════"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado. Instálalo primero."
    exit 1
fi
log_info "✓ Docker instalado: $(docker --version)"

# Verificar espacio en disco
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    log_warn "Espacio disponible bajo: ${AVAILABLE_SPACE}GB (recomendado: 5GB+)"
else
    log_info "✓ Espacio disponible: ${AVAILABLE_SPACE}GB"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "PASO 2: Seleccionar Dockerfile"
echo "═══════════════════════════════════════════════════════════════"

echo "Selecciona qué Dockerfile usar:"
echo "1) Dockerfile (principal, actualizado con NPM)"
echo "2) Dockerfile.simple (recomendado, más simple y robusto)"
echo "3) Ambos (secuencialmente)"
echo ""
read -p "Opción [2]: " DOCKERFILE_OPTION
DOCKERFILE_OPTION=${DOCKERFILE_OPTION:-2}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "PASO 3: Iniciar build"
echo "═══════════════════════════════════════════════════════════════"

build_image() {
    local dockerfile=$1
    local tag=$2
    
    log_info "Construyendo con $dockerfile..."
    echo "Tag: $tag"
    echo "Archivo de log: build-${tag}.log"
    echo ""
    
    if docker build \
        --progress=plain \
        -f "$dockerfile" \
        -t "escalafin:${tag}" \
        . 2>&1 | tee "build-${tag}.log"; then
        log_info "✓ Build exitoso con $dockerfile"
        return 0
    else
        log_error "✗ Build falló con $dockerfile"
        echo "Revisa el archivo build-${tag}.log para más detalles"
        return 1
    fi
}

case $DOCKERFILE_OPTION in
    1)
        build_image "Dockerfile" "main"
        BUILD_RESULT=$?
        ;;
    2)
        build_image "Dockerfile.simple" "simple"
        BUILD_RESULT=$?
        ;;
    3)
        log_info "Construyendo con ambos Dockerfiles..."
        echo ""
        build_image "Dockerfile" "main"
        RESULT1=$?
        echo ""
        build_image "Dockerfile.simple" "simple"
        RESULT2=$?
        
        if [ $RESULT1 -eq 0 ] && [ $RESULT2 -eq 0 ]; then
            BUILD_RESULT=0
        else
            BUILD_RESULT=1
        fi
        ;;
    *)
        log_error "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "PASO 4: Verificar resultado"
echo "═══════════════════════════════════════════════════════════════"

if [ $BUILD_RESULT -eq 0 ]; then
    log_info "✓ Build completado exitosamente"
    echo ""
    echo "Imágenes creadas:"
    docker images | grep escalafin | head -5
    echo ""
    log_info "Puedes ejecutar el contenedor con:"
    echo ""
    echo "  docker run -p 3000:3000 \\"
    echo "    -e DATABASE_URL=\"postgresql://user:pass@host:5432/db\" \\"
    echo "    -e NEXTAUTH_SECRET=\"tu-secret-aqui\" \\"
    echo "    escalafin:simple"
    echo ""
else
    log_error "Build falló. Revisa los logs para más detalles."
    echo ""
    echo "Troubleshooting:"
    echo "1. Verifica el archivo de log generado (build-*.log)"
    echo "2. Asegúrate de tener espacio suficiente en disco"
    echo "3. Intenta limpiar recursos de Docker:"
    echo "   docker system prune -a"
    echo "4. Revisa SOLUCION_ERROR_DOCKER_BUILD.md para más ayuda"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✓ TEST COMPLETADO"
echo "═══════════════════════════════════════════════════════════════"
