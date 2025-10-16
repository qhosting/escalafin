
#!/bin/bash

# Script de prueba de producción local sin Docker
# Simula ambiente tipo EasyPanel
# Fecha: 2025-10-16

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}========================================"
    echo -e "$1"
    echo -e "========================================${NC}"
    echo ""
}

cd "$(dirname "$0")/app"

log_section "🔍 ANÁLISIS DE DESPLIEGUE TIPO EASYPANEL"

# ========== PASO 1: Verificar configuración ==========
log_section "📋 PASO 1: Verificar Configuración"

log_info "Verificando next.config.js..."
if grep -q "output:" next.config.js; then
    log_info "Configuración de output encontrada:"
    grep "output:" next.config.js | head -5
else
    log_warn "No se encontró configuración de output"
fi

echo ""
log_info "Verificando variables de entorno en .env..."
if [ -f "../.env" ]; then
    log_info "Archivo .env existe"
    echo "Variables críticas:"
    grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET|AWS_BUCKET" ../.env | sed 's/=.*/=***/' || log_warn "Algunas variables no encontradas"
else
    log_error "Archivo .env no encontrado"
fi

# ========== PASO 2: Verificar dependencias ==========
log_section "📦 PASO 2: Verificar Dependencias"

log_info "Verificando node_modules..."
if [ -d "node_modules" ]; then
    log_info "✅ node_modules existe"
    log_info "Paquetes críticos:"
    ls node_modules/ | grep -E "^(next|react|@prisma|prisma)$" || log_warn "Algunos paquetes críticos no encontrados"
else
    log_error "❌ node_modules no existe - ejecutar: yarn install"
fi

# ========== PASO 3: Build de producción ==========
log_section "🏗️  PASO 3: Build de Producción"

log_info "Limpiando builds anteriores..."
rm -rf .next .build 2>/dev/null || true

log_info "Configurando variables de entorno para build..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

log_info "Ejecutando build de producción..."
BUILD_OUTPUT=$(yarn build 2>&1)
BUILD_EXIT_CODE=$?

echo "$BUILD_OUTPUT" > /tmp/escalafin-build-test.log

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log_info "✅ Build completado exitosamente"
    echo ""
    echo "$BUILD_OUTPUT" | tail -50
else
    log_error "❌ Build falló con código: $BUILD_EXIT_CODE"
    echo "$BUILD_OUTPUT" | tail -100
    exit 1
fi

# ========== PASO 4: Verificar output del build ==========
log_section "🔍 PASO 4: Verificar Output del Build"

log_info "Estructura de .next:"
ls -lh .next/ 2>/dev/null || log_error ".next no existe"

echo ""
log_info "Verificando standalone output..."
if [ -d ".next/standalone" ]; then
    log_info "✅ Standalone output generado"
    ls -lh .next/standalone/ | head -10
else
    log_warn "⚠️  Standalone output NO generado - puede causar problemas en EasyPanel"
fi

echo ""
log_info "Verificando static assets..."
if [ -d ".next/static" ]; then
    log_info "✅ Static assets generados"
    du -sh .next/static/
else
    log_error "❌ Static assets no encontrados"
fi

# ========== PASO 5: Análisis de errores comunes ==========
log_section "🔍 PASO 5: Análisis de Errores Comunes"

log_info "Buscando errores de build..."
if grep -i "error" /tmp/escalafin-build-test.log | grep -v "Dynamic server usage" | head -20; then
    log_warn "Se encontraron errores en el build (ver arriba)"
else
    log_info "✅ No se encontraron errores críticos"
fi

echo ""
log_info "Buscando warnings importantes..."
if grep -i "warn" /tmp/escalafin-build-test.log | grep -v "DEBUG_ENABLED" | head -10; then
    log_warn "Se encontraron warnings (revisar si son críticos)"
else
    log_info "✅ No se encontraron warnings importantes"
fi

# ========== PASO 6: Verificar módulos críticos ==========
log_section "🧩 PASO 6: Verificar Módulos Críticos"

log_info "Verificando Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    log_info "✅ Prisma Client generado"
else
    log_warn "⚠️  Prisma Client no encontrado - ejecutar: yarn prisma generate"
fi

echo ""
log_info "Verificando schema de Prisma..."
if [ -f "../prisma/schema.prisma" ]; then
    log_info "✅ Schema de Prisma existe"
    echo "Modelos definidos:"
    grep "^model " ../prisma/schema.prisma | wc -l | xargs echo "  -"
else
    log_error "❌ Schema de Prisma no encontrado"
fi

# ========== PASO 7: Test de inicio (breve) ==========
log_section "🚀 PASO 7: Test de Inicio (10 segundos)"

log_info "Iniciando servidor de producción..."
log_info "URL: http://localhost:3002"
echo ""

# Matar cualquier proceso anterior
pkill -f "next start" 2>/dev/null || true
sleep 2

# Iniciar en background
PORT=3002 yarn start > /tmp/escalafin-start-test.log 2>&1 &
SERVER_PID=$!

log_info "PID del servidor: $SERVER_PID"
sleep 8

# Verificar si sigue corriendo
if kill -0 $SERVER_PID 2>/dev/null; then
    log_info "✅ Servidor iniciado correctamente"
    
    echo ""
    log_info "Probando conectividad..."
    
    # Test homepage
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "✅ Homepage: $HTTP_CODE (OK)"
    else
        log_warn "⚠️  Homepage: $HTTP_CODE"
    fi
    
    # Test health
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "✅ Health check: $HTTP_CODE (OK)"
    else
        log_warn "⚠️  Health check: $HTTP_CODE"
    fi
    
    # Test login page
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/auth/login 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "✅ Login page: $HTTP_CODE (OK)"
    else
        log_warn "⚠️  Login page: $HTTP_CODE"
    fi
    
    echo ""
    log_info "Logs del servidor (últimas líneas):"
    tail -30 /tmp/escalafin-start-test.log | grep -v "Compiled" || echo "(sin logs relevantes)"
    
    # Detener servidor
    echo ""
    log_info "Deteniendo servidor de prueba..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    sleep 2
else
    log_error "❌ Servidor falló al iniciar"
    echo ""
    log_error "Logs del error:"
    cat /tmp/escalafin-start-test.log
    exit 1
fi

# ========== PASO 8: Reporte final ==========
log_section "📊 REPORTE FINAL"

log_info "✅ Análisis completado"
echo ""
echo "Archivos de log generados:"
echo "  - /tmp/escalafin-build-test.log (build output)"
echo "  - /tmp/escalafin-start-test.log (server logs)"
echo ""

log_info "Resumen de hallazgos:"
echo ""

# Contador de problemas
ISSUES=0

if [ ! -d ".next/standalone" ]; then
    echo "  ⚠️  1. Standalone output no generado"
    ISSUES=$((ISSUES + 1))
fi

if grep -q "error" /tmp/escalafin-build-test.log | grep -v "Dynamic server usage"; then
    echo "  ⚠️  2. Errores encontrados en build"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -d "node_modules/.prisma/client" ]; then
    echo "  ⚠️  3. Prisma Client necesita generarse"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    log_info "🎉 No se encontraron problemas críticos"
    log_info "La aplicación está lista para despliegue tipo EasyPanel"
else
    log_warn "Se encontraron $ISSUES problemas que revisar"
fi

echo ""
log_info "======================================"
log_info "Recomendaciones para despliegue:"
echo "  1. Verificar todas las variables de entorno"
echo "  2. Asegurar que DATABASE_URL apunte a PostgreSQL válido"
echo "  3. Configurar AWS S3 credentials si se usa almacenamiento"
echo "  4. Verificar NEXTAUTH_SECRET (min 32 caracteres)"
echo "  5. Ejecutar migraciones de Prisma en producción"
log_info "======================================"

