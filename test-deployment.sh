
#!/bin/bash

# Script de prueba de despliegue tipo EasyPanel
# Fecha: 2025-10-16

set -e

echo "========================================"
echo "🚀 PRUEBA DE DESPLIEGUE - TIPO EASYPANEL"
echo "========================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Limpieza de contenedores previos
log_info "Limpiando contenedores anteriores..."
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true
docker rm -f escalafin_test_app escalafin_test_db escalafin_test_redis 2>/dev/null || true

echo ""
log_info "Eliminando imágenes antiguas..."
docker rmi escalafin_mvp-app 2>/dev/null || true
docker image prune -f

echo ""
log_info "====== PASO 1: BUILD DE LA IMAGEN ======"
docker-compose -f docker-compose.test.yml build --no-cache 2>&1 | tee /tmp/docker-build.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    log_error "Build falló. Ver logs en /tmp/docker-build.log"
    exit 1
fi

log_info "✅ Build completado exitosamente"

echo ""
log_info "====== PASO 2: INICIAR SERVICIOS ======"
docker-compose -f docker-compose.test.yml up -d postgres redis

echo ""
log_info "Esperando que la base de datos esté lista..."
timeout=60
counter=0
while ! docker exec escalafin_test_db pg_isready -U escalafin_user > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        log_error "Base de datos no respondió en ${timeout}s"
        docker-compose -f docker-compose.test.yml logs postgres
        exit 1
    fi
    echo -n "."
done
echo ""
log_info "✅ Base de datos lista"

echo ""
log_info "====== PASO 3: INICIAR APLICACIÓN ======"
docker-compose -f docker-compose.test.yml up -d app

echo ""
log_info "Esperando que la aplicación esté lista..."
sleep 10

# Seguir logs en background
log_info "Logs de la aplicación (primeros 30 segundos):"
timeout 30s docker-compose -f docker-compose.test.yml logs -f app &
LOGS_PID=$!

sleep 30
kill $LOGS_PID 2>/dev/null || true

echo ""
log_info "====== PASO 4: VERIFICAR SALUD DE CONTENEDORES ======"
docker-compose -f docker-compose.test.yml ps

echo ""
log_info "====== PASO 5: PRUEBAS DE CONECTIVIDAD ======"

# Test 1: Health check
echo ""
log_info "Test 1: Health check endpoint..."
if curl -f http://localhost:3001/api/health -o /dev/null -s -w "%{http_code}\n" | grep -q "200"; then
    log_info "✅ Health check OK"
else
    log_warn "⚠️  Health check falló o no disponible"
fi

# Test 2: Homepage
echo ""
log_info "Test 2: Homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_info "✅ Homepage respondió correctamente (200)"
else
    log_warn "⚠️  Homepage respondió con código: $HTTP_CODE"
fi

# Test 3: API routes
echo ""
log_info "Test 3: API de sistema..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/system/config || echo "000")
log_info "API /api/system/config: $HTTP_CODE"

# Test 4: Auth login page
echo ""
log_info "Test 4: Página de login..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/login || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log_info "✅ Página de login accesible (200)"
else
    log_warn "⚠️  Página de login respondió con código: $HTTP_CODE"
fi

echo ""
log_info "====== PASO 6: REVISAR LOGS DE ERROR ======"
echo ""
log_info "Últimos logs de la aplicación:"
docker-compose -f docker-compose.test.yml logs --tail=50 app

echo ""
log_info "====== PASO 7: VERIFICAR BASE DE DATOS ======"
docker exec escalafin_test_db psql -U escalafin_user -d escalafin_db -c "\dt" 2>&1 | head -20

echo ""
log_info "======================================"
log_info "📊 RESUMEN DE LA PRUEBA"
log_info "======================================"
echo ""
log_info "URL de prueba: http://localhost:3001"
log_info "Base de datos: localhost:5433"
log_info "Redis: localhost:6380"
echo ""
log_info "Para ver logs en tiempo real:"
echo "  docker-compose -f docker-compose.test.yml logs -f app"
echo ""
log_info "Para detener:"
echo "  docker-compose -f docker-compose.test.yml down"
echo ""
log_info "Para reiniciar la app:"
echo "  docker-compose -f docker-compose.test.yml restart app"
echo ""

# Mantener logs activos
log_info "======================================"
log_info "Siguiendo logs de la aplicación (Ctrl+C para salir)..."
log_info "======================================"
echo ""
docker-compose -f docker-compose.test.yml logs -f app
