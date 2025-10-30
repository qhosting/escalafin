
#!/bin/bash

# 🔍 PRE-BUILD CHECK - Verificación antes de build Docker
# Detecta problemas que causarían fallo en el build

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   PRE-BUILD CHECK - EscalaFin MVP                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
CHECKS=0

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    CHECKS=$((CHECKS + 1))
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}═══ 1. VERIFICANDO ARCHIVOS CRÍTICOS PARA DOCKER BUILD ═══${NC}"
echo ""

# Verificar Dockerfile
if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile no encontrado"
else
    log_success "Dockerfile existe"
    
    # Verificar que tenga las verificaciones de node_modules
    if grep -q "test -d \"node_modules\"" Dockerfile; then
        log_success "Dockerfile tiene verificación de node_modules"
    else
        log_warning "Dockerfile no tiene verificación explícita de node_modules"
    fi
fi

echo ""
echo -e "${BLUE}═══ 2. VERIFICANDO ARCHIVOS PARA STAGE DEPS ═══${NC}"
echo ""

# Verificar package.json
if [ ! -f "app/package.json" ]; then
    log_error "app/package.json no encontrado"
else
    log_success "app/package.json existe"
    
    # Verificar que tenga dependencias
    if grep -q "\"dependencies\"" app/package.json; then
        log_success "package.json tiene dependencias definidas"
    else
        log_error "package.json NO tiene dependencias"
    fi
fi

# Verificar yarn.lock
if [ ! -f "app/yarn.lock" ]; then
    log_error "app/yarn.lock no encontrado - Build fallará"
else
    log_success "app/yarn.lock existe"
    
    # Verificar que NO sea un symlink
    if [ -L "app/yarn.lock" ]; then
        log_error "yarn.lock es un SYMLINK - Docker no puede copiarlo"
        log_info "Ejecuta: bash scripts/fix-yarn-lock-symlink.sh"
    else
        log_success "yarn.lock es un archivo regular"
        
        # Verificar tamaño
        SIZE=$(stat -f%z "app/yarn.lock" 2>/dev/null || stat -c%s "app/yarn.lock" 2>/dev/null)
        if [ "$SIZE" -lt 1000 ]; then
            log_error "yarn.lock parece vacío o corrupto (tamaño: $SIZE bytes)"
        else
            SIZE_KB=$((SIZE / 1024))
            log_success "yarn.lock tiene tamaño válido (${SIZE_KB}KB)"
        fi
    fi
fi

echo ""
echo -e "${BLUE}═══ 3. VERIFICANDO COHERENCIA PACKAGE.JSON vs YARN.LOCK ═══${NC}"
echo ""

if [ -f "app/package.json" ] && [ -f "app/yarn.lock" ]; then
    # Verificar que yarn.lock no sea más antiguo que package.json
    PKG_TIME=$(stat -f%m "app/package.json" 2>/dev/null || stat -c%Y "app/package.json" 2>/dev/null)
    LOCK_TIME=$(stat -f%m "app/yarn.lock" 2>/dev/null || stat -c%Y "app/yarn.lock" 2>/dev/null)
    
    if [ "$LOCK_TIME" -lt "$PKG_TIME" ]; then
        log_error "yarn.lock es más antiguo que package.json"
        log_info "Ejecuta: cd app && yarn install"
    else
        log_success "yarn.lock está actualizado"
    fi
fi

echo ""
echo -e "${BLUE}═══ 4. VERIFICANDO ARCHIVOS PARA STAGE BUILDER ═══${NC}"
echo ""

# Verificar estructura de app/
REQUIRED_DIRS=(
    "app/components"
    "app/lib"
    "app/prisma"
    "app/public"
)

for DIR in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$DIR" ]; then
        log_error "Directorio requerido no encontrado: $DIR"
    else
        log_success "Directorio existe: $DIR"
    fi
done

# Verificar archivos críticos de configuración
REQUIRED_FILES=(
    "app/next.config.js"
    "app/tsconfig.json"
    "app/prisma/schema.prisma"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$FILE" ]; then
        log_error "Archivo requerido no encontrado: $FILE"
    else
        log_success "Archivo existe: $FILE"
    fi
done

echo ""
echo -e "${BLUE}═══ 5. VERIFICANDO SCRIPTS DE STARTUP PARA STAGE RUNNER ═══${NC}"
echo ""

STARTUP_SCRIPTS=(
    "start-improved.sh"
    "emergency-start.sh"
)

for SCRIPT in "${STARTUP_SCRIPTS[@]}"; do
    if [ ! -f "$SCRIPT" ]; then
        log_error "Script de startup no encontrado: $SCRIPT"
    else
        log_success "Script existe: $SCRIPT"
        
        # Verificar que sea ejecutable
        if [ -x "$SCRIPT" ]; then
            log_success "$SCRIPT es ejecutable"
        else
            log_warning "$SCRIPT NO es ejecutable (se corregirá en Docker)"
        fi
    fi
done

echo ""
echo -e "${BLUE}═══ 6. VERIFICANDO .dockerignore ═══${NC}"
echo ""

if [ ! -f ".dockerignore" ]; then
    log_warning ".dockerignore no encontrado"
else
    log_success ".dockerignore existe"
    
    # Verificar que NO ignore archivos críticos
    CRITICAL_FILES=(
        "start-improved.sh"
        "emergency-start.sh"
        "app/yarn.lock"
        "app/package.json"
    )
    
    for FILE in "${CRITICAL_FILES[@]}"; do
        if grep -q "^${FILE}$" .dockerignore 2>/dev/null; then
            log_error "$FILE está en .dockerignore - Docker no podrá copiarlo"
        else
            log_success "$FILE NO está ignorado"
        fi
    done
fi

echo ""
echo -e "${BLUE}═══ 7. TEST RÁPIDO DE BUILD (SOLO STAGE DEPS) - OPCIONAL ═══${NC}"
echo ""

# Verificar si Docker está disponible
if ! command -v docker &> /dev/null; then
    log_warning "Docker no disponible - Saltando test de build"
    log_info "Este test es opcional. Las verificaciones críticas ya pasaron."
else
    log_info "Probando solo el stage 'deps' para verificar node_modules..."
    echo ""

    # Intentar build solo del stage deps
    if docker build --target deps -t escalafin-test-deps:latest . > /tmp/docker-build-test.log 2>&1; then
        log_success "Stage 'deps' build exitoso"
        
        # Verificar que node_modules fue generado en la imagen
        if docker run --rm escalafin-test-deps:latest test -d /app/node_modules 2>/dev/null; then
            log_success "node_modules verificado en imagen deps"
            
            # Contar paquetes
            PACKAGE_COUNT=$(docker run --rm escalafin-test-deps:latest sh -c "ls /app/node_modules | wc -l" 2>/dev/null || echo "0")
            if [ "$PACKAGE_COUNT" -gt 10 ]; then
                log_success "node_modules tiene $PACKAGE_COUNT paquetes"
            else
                log_error "node_modules parece vacío (solo $PACKAGE_COUNT paquetes)"
            fi
        else
            log_error "node_modules NO existe en imagen deps"
        fi
        
        # Limpiar imagen de test
        docker rmi escalafin-test-deps:latest > /dev/null 2>&1 || true
    else
        log_error "Build del stage 'deps' falló"
        log_info "Ver logs completos en: /tmp/docker-build-test.log"
        if [ -f /tmp/docker-build-test.log ]; then
            echo ""
            echo "Últimas líneas del error:"
            tail -20 /tmp/docker-build-test.log
        fi
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     RESUMEN FINAL                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo -e "Verificaciones exitosas: ${GREEN}$CHECKS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Errores: ${RED}$ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ PRE-BUILD CHECK PASÓ - OK para build Docker${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ PRE-BUILD CHECK FALLÓ - $ERRORS error(es) detectado(s)${NC}"
    echo ""
    echo "Acciones recomendadas:"
    echo "1. Corrige los errores indicados arriba"
    if grep -q "yarn.lock es un SYMLINK" <(echo "$OUTPUT" 2>/dev/null); then
        echo "2. Ejecuta: bash scripts/fix-yarn-lock-symlink.sh"
    fi
    if grep -q "yarn.lock es más antiguo" <(echo "$OUTPUT" 2>/dev/null); then
        echo "3. Ejecuta: cd app && yarn install"
    fi
    echo ""
    exit 1
fi
