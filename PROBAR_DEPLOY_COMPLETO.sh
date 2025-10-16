
#!/bin/bash

# 🧪 Script de Prueba Completa del Deployment
# Versión: 1.0
# Fecha: 2025-10-16
# Verifica todas las correcciones implementadas en v15.0

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Función para test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST ${TESTS_TOTAL}: ${test_name}${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if eval "$test_command"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✅ PASÓ${NC}\n"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}❌ FALLÓ${NC}"
        echo -e "${YELLOW}   Se esperaba: ${expected}${NC}\n"
        return 1
    fi
}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🧪 PRUEBA COMPLETA DE DEPLOYMENT - EscalaFin v15.0       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Este script verifica todas las correcciones implementadas${NC}"
echo -e "${YELLOW}para resolver los problemas detectados en el análisis.${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: No se encuentra el Dockerfile${NC}"
    echo "   Ejecuta este script desde /home/ubuntu/escalafin_mvp"
    exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 1: VERIFICACIÓN DE ARCHIVOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_test \
    "Verificar que Dockerfile existe" \
    "[ -f 'Dockerfile' ]" \
    "Archivo Dockerfile debe existir"

run_test \
    "Verificar versión del Dockerfile (v15.0)" \
    "grep -q 'Versión: 15.0' Dockerfile" \
    "Dockerfile debe ser versión 15.0"

run_test \
    "Verificar que start.sh existe en root" \
    "[ -f 'start.sh' ]" \
    "start.sh debe estar en el root del proyecto"

run_test \
    "Verificar que healthcheck.sh existe en root" \
    "[ -f 'healthcheck.sh' ]" \
    "healthcheck.sh debe estar en el root del proyecto"

run_test \
    "Verificar que start.sh es ejecutable" \
    "[ -x 'start.sh' ]" \
    "start.sh debe tener permisos de ejecución"

run_test \
    "Verificar que healthcheck.sh es ejecutable" \
    "[ -x 'healthcheck.sh' ]" \
    "healthcheck.sh debe tener permisos de ejecución"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 2: VERIFICACIÓN DE CONFIGURACIONES${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_test \
    "Verificar NEXT_OUTPUT_MODE=standalone en Dockerfile" \
    "grep -q 'ENV NEXT_OUTPUT_MODE=standalone' Dockerfile" \
    "Dockerfile debe establecer NEXT_OUTPUT_MODE=standalone"

run_test \
    "Verificar npm version pinned a 10.9.0" \
    "grep -q 'npm@10.9.0' Dockerfile" \
    "Dockerfile debe usar npm 10.9.0 específico"

run_test \
    "Verificar COPY de scripts desde root" \
    "grep -q 'COPY start.sh healthcheck.sh /app/' Dockerfile" \
    "Dockerfile debe copiar scripts desde root"

run_test \
    "Verificar CMD usa start.sh" \
    "grep -q 'CMD.*start.sh' Dockerfile" \
    "Dockerfile debe usar start.sh como CMD"

run_test \
    "Verificar healthcheck.sh usa wget" \
    "grep -q 'wget' healthcheck.sh" \
    "healthcheck.sh debe usar wget en lugar de curl"

run_test \
    "Verificar next.config.js existe" \
    "[ -f 'app/next.config.js' ]" \
    "next.config.js debe existir"

run_test \
    "Verificar next.config.js usa NEXT_OUTPUT_MODE" \
    "grep -q 'NEXT_OUTPUT_MODE' app/next.config.js" \
    "next.config.js debe leer NEXT_OUTPUT_MODE"

run_test \
    "Verificar docker-compose.yml existe" \
    "[ -f 'docker-compose.yml' ]" \
    "docker-compose.yml debe existir"

run_test \
    "Verificar docker-compose.yml tiene NEXT_OUTPUT_MODE" \
    "grep -q 'NEXT_OUTPUT_MODE=standalone' docker-compose.yml" \
    "docker-compose.yml debe establecer NEXT_OUTPUT_MODE"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 3: VERIFICACIÓN DE ESTRUCTURA${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_test \
    "Verificar estructura app/package.json" \
    "[ -f 'app/package.json' ]" \
    "package.json debe estar en app/"

run_test \
    "Verificar estructura app/package-lock.json" \
    "[ -f 'app/package-lock.json' ]" \
    "package-lock.json debe estar en app/"

run_test \
    "Verificar lockfileVersion 3" \
    "grep -q '\"lockfileVersion\": 3' app/package-lock.json" \
    "package-lock.json debe usar lockfileVersion 3"

run_test \
    "Verificar prisma schema" \
    "[ -f 'app/prisma/schema.prisma' ]" \
    "schema.prisma debe existir"

run_test \
    "Verificar estructura app/app/" \
    "[ -d 'app/app' ]" \
    "Directorio app/app/ (Next.js routes) debe existir"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 4: VERIFICACIÓN DE DOCKERFILE.COOLIFY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_test \
    "Verificar Dockerfile.coolify existe" \
    "[ -f 'Dockerfile.coolify' ]" \
    "Dockerfile.coolify debe existir"

run_test \
    "Verificar Dockerfile.coolify versión 15.0" \
    "grep -q 'Versión: 15.0' Dockerfile.coolify" \
    "Dockerfile.coolify debe ser v15.0"

run_test \
    "Verificar Dockerfile.coolify tiene NEXT_OUTPUT_MODE" \
    "grep -q 'ENV NEXT_OUTPUT_MODE=standalone' Dockerfile.coolify" \
    "Dockerfile.coolify debe establecer NEXT_OUTPUT_MODE"

run_test \
    "Verificar Dockerfile.coolify copia scripts" \
    "grep -q 'COPY start.sh healthcheck.sh' Dockerfile.coolify" \
    "Dockerfile.coolify debe copiar scripts"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}FASE 5: VERIFICACIÓN DE LÓGICA DE SCRIPTS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

run_test \
    "Verificar start.sh busca server.js" \
    "grep -q 'server.js' start.sh" \
    "start.sh debe buscar y verificar server.js"

run_test \
    "Verificar start.sh ejecuta migraciones" \
    "grep -q 'migrate' start.sh" \
    "start.sh debe ejecutar migraciones de Prisma"

run_test \
    "Verificar start.sh ejecuta seed" \
    "grep -q 'seed' start.sh" \
    "start.sh debe verificar y ejecutar seed si es necesario"

run_test \
    "Verificar start.sh usa node server.js" \
    "grep -q 'node server.js' start.sh" \
    "start.sh debe ejecutar node server.js al final"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}RESUMEN DE PRUEBAS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total de pruebas: ${TESTS_TOTAL}"
echo -e "${GREEN}Pruebas exitosas: ${TESTS_PASSED}${NC}"
echo -e "${RED}Pruebas fallidas: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODAS LAS PRUEBAS PASARON                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}✅ El deployment está correctamente configurado${NC}"
    echo -e "${BLUE}✅ Todas las correcciones de v15.0 están implementadas${NC}"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PRÓXIMO PASO: BUILD DE DOCKER${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Ahora puedes hacer el build de Docker:"
    echo -e "  ${CYAN}docker build -t escalafin-test .${NC}"
    echo ""
    echo -e "O usar docker-compose:"
    echo -e "  ${CYAN}docker-compose build${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ ALGUNAS PRUEBAS FALLARON                               ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Por favor, revisa los errores arriba y corrígelos${NC}"
    echo -e "${YELLOW}⚠️  Consulta ANALISIS_PROBLEMAS_DEPLOY.md para más detalles${NC}"
    echo ""
    exit 1
fi
