
#!/bin/bash

# 🧪 SCRIPT DE TESTING SISTEMÁTICO PARA DOCKERFILES
# Testa cada Dockerfile incrementalmente

set -e

echo "🧪 =========================================="
echo "   TESTING SISTEMÁTICO DE DOCKERFILES"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ===================================
# TEST 1: Backend/Prisma
# ===================================
echo "📋 TEST 1: Backend/Prisma (Dockerfile.step1-backend)"
echo "---"

if docker build -t escalafin-test-backend -f Dockerfile.step1-backend . 2>&1 | tee /tmp/docker-step1.log; then
    log_success "STEP 1 COMPLETADO: Backend/Prisma OK"
    echo ""
else
    log_error "STEP 1 FALLIDO: Revisar /tmp/docker-step1.log"
    exit 1
fi

# ===================================
# TEST 2: Frontend/Next.js Build
# ===================================
echo "📋 TEST 2: Frontend/Next.js Build (Dockerfile.step2-frontend)"
echo "---"

if docker build -t escalafin-test-frontend -f Dockerfile.step2-frontend . 2>&1 | tee /tmp/docker-step2.log; then
    log_success "STEP 2 COMPLETADO: Frontend/Next.js Build OK"
    echo ""
    
    # Verificar que server.js existe
    if docker run --rm escalafin-test-frontend ls /app/server.js > /dev/null 2>&1; then
        log_success "server.js verificado"
    else
        log_error "server.js NO encontrado"
        exit 1
    fi
else
    log_error "STEP 2 FALLIDO: Revisar /tmp/docker-step2.log"
    exit 1
fi

# ===================================
# TEST 3: Build Completo
# ===================================
echo "📋 TEST 3: Build Completo Integrado (Dockerfile.step3-full)"
echo "---"

if docker build -t escalafin-test-full -f Dockerfile.step3-full . 2>&1 | tee /tmp/docker-step3.log; then
    log_success "STEP 3 COMPLETADO: Build Completo OK"
    echo ""
else
    log_error "STEP 3 FALLIDO: Revisar /tmp/docker-step3.log"
    exit 1
fi

# ===================================
# TEST 4: Healthcheck
# ===================================
echo "📋 TEST 4: Testing Healthcheck"
echo "---"

# Crear .env temporal para test
cat > /tmp/test.env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-for-testing-only
SKIP_ENV_VALIDATION=1
NODE_ENV=production
EOF

log_info "Iniciando contenedor de prueba..."
CONTAINER_ID=$(docker run -d --env-file /tmp/test.env -p 3001:3000 escalafin-test-full)

log_info "Esperando 30 segundos para que inicie..."
sleep 30

# Verificar healthcheck
if docker exec $CONTAINER_ID /app/healthcheck.sh; then
    log_success "Healthcheck OK"
else
    log_error "Healthcheck FALLIDO"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# Verificar que responde HTTP
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log_success "API Health endpoint OK"
else
    log_error "API Health endpoint NO responde"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# Limpiar
docker stop $CONTAINER_ID
docker rm $CONTAINER_ID
rm /tmp/test.env

# ===================================
# RESUMEN FINAL
# ===================================
echo ""
echo "🎉 =========================================="
echo "   ✅ TODOS LOS TESTS PASARON"
echo "=========================================="
echo ""
echo "✓ Backend/Prisma: OK"
echo "✓ Frontend/Next.js: OK"
echo "✓ Build Completo: OK"
echo "✓ Healthcheck: OK"
echo "✓ API Health: OK"
echo ""
echo "🚀 LISTO PARA DEPLOY EN EASYPANEL"
echo ""
echo "Próximos pasos:"
echo "1. Push a GitHub: git push origin main"
echo "2. Configurar en EasyPanel:"
echo "   - Método: Dockerfile"
echo "   - Dockerfile: Dockerfile.step3-full"
echo "   - Ruta de compilación: /app"
echo "3. Configurar variables de entorno en EasyPanel"
echo "4. Deploy!"
echo ""
