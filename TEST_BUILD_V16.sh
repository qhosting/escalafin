
#!/bin/bash

# 🧪 Script de Prueba - Dockerfile v16.0
# Prueba el build de Docker con el nuevo approach de npm install

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🧪 PRUEBA DE BUILD - ESCALAFIN DOCKERFILE v16.0"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    log_error "Error: Dockerfile no encontrado"
    log_info "Por favor ejecuta este script desde /home/ubuntu/escalafin_mvp"
    exit 1
fi

log_info "Directorio correcto confirmado"
echo ""

# Verificar package-lock.json
if [ -f "app/package-lock.json" ]; then
    log_info "package-lock.json encontrado"
    LOCKFILE_VERSION=$(grep -o '"lockfileVersion": [0-9]*' app/package-lock.json | grep -o '[0-9]*')
    log_info "lockfileVersion detectado: $LOCKFILE_VERSION"
else
    log_warn "package-lock.json no encontrado"
fi
echo ""

# Limpiar builds anteriores
log_info "Limpiando builds anteriores..."
docker rmi escalafin:v16-test 2>/dev/null || true
echo ""

# Iniciar el build
log_info "Iniciando build de Docker con Dockerfile v16.0..."
log_info "Usando: npm install (en lugar de npm ci)"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Build con verbose output
if docker build -t escalafin:v16-test . --progress=plain; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    log_info "✅ BUILD EXITOSO"
    echo ""
    
    # Verificar la imagen
    log_info "Verificando imagen creada..."
    docker images escalafin:v16-test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    
    # Información adicional
    log_info "Detalles de la imagen:"
    docker inspect escalafin:v16-test --format '- ID: {{.Id}}' | head -c 80
    echo ""
    docker inspect escalafin:v16-test --format '- Created: {{.Created}}'
    docker inspect escalafin:v16-test --format '- Size: {{.Size}} bytes'
    echo ""
    
    log_info "Para ejecutar la imagen:"
    echo "  docker run -p 3000:3000 escalafin:v16-test"
    echo ""
    
    log_info "Para pushear a Docker Hub:"
    echo "  docker tag escalafin:v16-test yourusername/escalafin:v16"
    echo "  docker push yourusername/escalafin:v16"
    echo ""
    
    log_info "Build completado exitosamente! 🎉"
    
else
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    log_error "BUILD FALLÓ"
    echo ""
    log_error "Revisa los logs arriba para identificar el error"
    echo ""
    log_info "Troubleshooting:"
    echo "  1. Verifica que todas las dependencias en package.json sean válidas"
    echo "  2. Verifica que el package-lock.json no esté corrupto"
    echo "  3. Intenta regenerar el package-lock.json localmente:"
    echo "     cd app && rm package-lock.json && npm install"
    echo ""
    exit 1
fi

echo "════════════════════════════════════════════════════════════════"
