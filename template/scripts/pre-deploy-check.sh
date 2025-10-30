
#!/bin/bash

# 🔍 PRE-DEPLOY CHECK - EscalaFin MVP
# Verifica que todo esté listo antes de hacer deploy en EasyPanel

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
CHECKS=0

# Logging functions
log_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${BLUE}$1${NC}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
}

log_check() {
    echo -e "${BLUE}🔍 Verificando:${NC} $1"
}

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

# Start
log_header "🚀 PRE-DEPLOY CHECK - EscalaFin MVP"
START_TIME=$(date +%s)

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -f "app/package.json" ]; then
    log_error "No estás en el directorio del proyecto"
    log_info "Ejecuta desde: /home/ubuntu/escalafin_mvp"
    exit 1
fi

# Si estamos en el root del proyecto
if [ -f "app/package.json" ]; then
    cd "$(dirname "$0")/.."
fi

log_success "Directorio del proyecto confirmado"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. ARCHIVOS CRÍTICOS
# ═══════════════════════════════════════════════════════════════
log_header "📁 1. Verificando Archivos Críticos"

# Dockerfile
log_check "Dockerfile"
if [ -f "Dockerfile" ]; then
    VERSION=$(grep "Versión:" Dockerfile | head -1 | grep -o '[0-9]\+\.[0-9]\+' || echo "unknown")
    log_success "Dockerfile existe (versión: $VERSION)"
    
    # Verificar que sea v16.0 o superior
    if [ "$VERSION" != "unknown" ]; then
        MAJOR=$(echo "$VERSION" | cut -d. -f1)
        if [ "$MAJOR" -ge 16 ]; then
            log_success "Versión del Dockerfile es correcta (>= 16.0)"
        else
            log_warning "Versión del Dockerfile es antigua ($VERSION). Se recomienda v16.0+"
        fi
    fi
else
    log_error "Dockerfile NO encontrado"
fi

# .dockerignore
log_check ".dockerignore"
if [ -f ".dockerignore" ]; then
    log_success ".dockerignore existe"
else
    log_warning ".dockerignore NO encontrado (recomendado para optimizar build)"
fi

# package.json
log_check "app/package.json"
if [ -f "app/package.json" ]; then
    log_success "package.json existe"
    
    # Verificar scripts críticos
    if grep -q '"build"' app/package.json; then
        log_success "Script 'build' encontrado"
    else
        log_error "Script 'build' NO encontrado en package.json"
    fi
    
    if grep -q '"start"' app/package.json; then
        log_success "Script 'start' encontrado"
    else
        log_error "Script 'start' NO encontrado en package.json"
    fi
else
    log_error "package.json NO encontrado"
fi

# package-lock.json
log_check "app/package-lock.json"
if [ -f "app/package-lock.json" ]; then
    LOCKFILE_VERSION=$(grep -o '"lockfileVersion": [0-9]*' app/package-lock.json | grep -o '[0-9]*' || echo "unknown")
    log_success "package-lock.json existe (lockfileVersion: $LOCKFILE_VERSION)"
else
    log_error "package-lock.json NO encontrado"
fi

# next.config.js
log_check "app/next.config.js"
if [ -f "app/next.config.js" ]; then
    log_success "next.config.js existe"
    
    # Verificar output standalone
    if grep -Eq "output.*standalone|output.*NEXT_OUTPUT_MODE" app/next.config.js; then
        log_success "output: 'standalone' configurado (CRÍTICO para Docker)"
    else
        log_error "output: 'standalone' NO configurado en next.config.js"
        log_info "Agrega: output: 'standalone' en next.config.js"
    fi
else
    log_error "next.config.js NO encontrado"
fi

# Prisma schema
log_check "app/prisma/schema.prisma"
if [ -f "app/prisma/schema.prisma" ]; then
    log_success "Prisma schema existe"
    
    # Contar modelos
    MODEL_COUNT=$(grep -c "^model " app/prisma/schema.prisma || echo "0")
    log_info "Modelos definidos: $MODEL_COUNT"
else
    log_error "Prisma schema NO encontrado"
fi

# Scripts de inicio
log_check "start.sh"
if [ -f "start.sh" ]; then
    log_success "start.sh existe"
    
    if [ -x "start.sh" ]; then
        log_success "start.sh tiene permisos de ejecución"
    else
        log_warning "start.sh NO tiene permisos de ejecución"
        log_info "Ejecuta: chmod +x start.sh"
    fi
else
    log_warning "start.sh NO encontrado (recomendado)"
fi

log_check "healthcheck.sh"
if [ -f "healthcheck.sh" ]; then
    log_success "healthcheck.sh existe"
    
    if [ -x "healthcheck.sh" ]; then
        log_success "healthcheck.sh tiene permisos de ejecución"
    else
        log_warning "healthcheck.sh NO tiene permisos de ejecución"
        log_info "Ejecuta: chmod +x healthcheck.sh"
    fi
else
    log_warning "healthcheck.sh NO encontrado (recomendado)"
fi

# .env.example
log_check ".env.example"
if [ -f ".env.example" ]; then
    log_success ".env.example existe"
else
    log_warning ".env.example NO encontrado (recomendado como template)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. GIT STATUS
# ═══════════════════════════════════════════════════════════════
log_header "🔄 2. Verificando Git Status"

# Verificar si hay cambios sin commitear
if git diff-index --quiet HEAD --; then
    log_success "No hay cambios sin commitear"
else
    log_warning "Hay cambios sin commitear"
    log_info "Archivos modificados:"
    git status --short | head -10
    echo ""
    log_info "Considera hacer commit antes del deploy"
fi

# Verificar branch actual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
log_info "Branch actual: $CURRENT_BRANCH"

# Verificar último commit
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "unknown")
log_info "Último commit: $LAST_COMMIT"

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. DEPENDENCIAS
# ═══════════════════════════════════════════════════════════════
log_header "📦 3. Verificando Dependencias"

# Verificar dependencias críticas en package.json
CRITICAL_DEPS=("next" "react" "react-dom" "@prisma/client" "next-auth")

for dep in "${CRITICAL_DEPS[@]}"; do
    log_check "$dep"
    if grep -q "\"$dep\"" app/package.json; then
        VERSION=$(grep "\"$dep\"" app/package.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')
        log_success "$dep: $VERSION"
    else
        log_error "$dep NO encontrado en package.json"
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. CONFIGURACIÓN DOCKER
# ═══════════════════════════════════════════════════════════════
log_header "🐳 4. Verificando Configuración Docker"

# Verificar stages en Dockerfile
if [ -f "Dockerfile" ]; then
    STAGES=$(grep -c "^FROM " Dockerfile || echo "0")
    log_info "Stages en Dockerfile: $STAGES (multi-stage build)"
    
    # Verificar comandos críticos
    if grep -q "npm install" Dockerfile; then
        log_success "npm install encontrado en Dockerfile"
    else
        log_warning "npm install NO encontrado en Dockerfile"
    fi
    
    if grep -q "npx prisma generate" Dockerfile; then
        log_success "prisma generate encontrado en Dockerfile"
    else
        log_error "prisma generate NO encontrado en Dockerfile"
    fi
    
    if grep -q "npm run build" Dockerfile; then
        log_success "npm run build encontrado en Dockerfile"
    else
        log_error "npm run build NO encontrado en Dockerfile"
    fi
    
    # Verificar EXPOSE
    if grep -q "EXPOSE 3000" Dockerfile; then
        log_success "EXPOSE 3000 configurado"
    else
        log_warning "EXPOSE 3000 NO encontrado (recomendado)"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════
log_header "🔐 5. Verificando Template de Variables de Entorno"

if [ -f ".env.example" ]; then
    CRITICAL_VARS=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "NODE_ENV")
    
    for var in "${CRITICAL_VARS[@]}"; do
        log_check "$var"
        if grep -q "^$var=" .env.example; then
            log_success "$var presente en .env.example"
        else
            log_warning "$var NO encontrado en .env.example"
        fi
    done
else
    log_warning "No se puede verificar (.env.example no existe)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. ESTRUCTURA DE DIRECTORIOS
# ═══════════════════════════════════════════════════════════════
log_header "📂 6. Verificando Estructura de Directorios"

REQUIRED_DIRS=("app" "app/prisma" "app/lib" "app/components")

for dir in "${REQUIRED_DIRS[@]}"; do
    log_check "$dir"
    if [ -d "$dir" ]; then
        FILE_COUNT=$(find "$dir" -type f | wc -l)
        log_success "$dir existe ($FILE_COUNT archivos)"
    else
        log_error "$dir NO encontrado"
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_header "📊 Resumen de Verificación"

echo -e "${GREEN}Checks exitosos: $CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errores: $ERRORS${NC}"
echo -e "${BLUE}Duración: ${DURATION}s${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    log_header "✅ PRE-DEPLOY CHECK EXITOSO"
    echo ""
    echo "Tu proyecto está listo para hacer deploy en EasyPanel! 🚀"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Configura las variables de entorno en EasyPanel"
    echo "  2. Inicia el deploy desde EasyPanel"
    echo "  3. Monitorea los logs durante el build"
    echo "  4. Ejecuta post-deploy-check.sh después del deploy"
    echo ""
    exit 0
else
    log_header "❌ PRE-DEPLOY CHECK FALLÓ"
    echo ""
    echo "Se encontraron $ERRORS errores críticos."
    echo "Por favor corrige los errores antes de hacer deploy."
    echo ""
    echo "Para más información, consulta:"
    echo "  - ESTRATEGIA_DEPLOY_EASYPANEL.md"
    echo "  - FIX_NPM_CI_LOCKFILEVERSION.md"
    echo ""
    exit 1
fi
