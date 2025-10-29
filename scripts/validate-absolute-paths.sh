
#!/bin/bash

# 🔍 VALIDACIÓN DE RUTAS ABSOLUTAS
# Detecta rutas absolutas problemáticas en el código fuente que pueden
# causar errores en Docker y diferentes entornos

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ERRORS=0
WARNINGS=0

log_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${BLUE}$1${NC}"
    echo "════════════════════════════════════════════════════════════════"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_header "🔍 VALIDACIÓN DE RUTAS ABSOLUTAS"
echo "Escaneando código fuente en busca de rutas absolutas problemáticas..."
echo ""

# ═══════════════════════════════════════════════════════════════
# RUTAS ABSOLUTAS PROBLEMÁTICAS
# ═══════════════════════════════════════════════════════════════

log_header "1. Buscando rutas absolutas del sistema host"

# Patrones a buscar
PROBLEMATIC_PATTERNS=(
    "/opt/hostedapp"
    "/home/ubuntu"
    "/root/"
    "/usr/local/specific"
)

# Extensiones de archivos a verificar
EXTENSIONS=(
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.json"
)

# Directorios a excluir
EXCLUDE_DIRS=(
    "node_modules"
    ".next"
    ".git"
    "dist"
    "build"
    ".build"
    "coverage"
    ".yarn"
    ".turbo"
    "out"
)

# Construir expresión de exclusión para find
EXCLUDE_EXPR=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    EXCLUDE_EXPR="$EXCLUDE_EXPR -path '*/$dir' -prune -o"
done

# Buscar cada patrón problemático
for pattern in "${PROBLEMATIC_PATTERNS[@]}"; do
    echo ""
    log_info "Buscando: $pattern"
    
    FOUND=false
    
    # Buscar en todos los archivos relevantes excluyendo directorios build
    RESULTS=$(find app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/.next/*" \
        ! -path "*/.build/*" \
        ! -path "*/dist/*" \
        ! -path "*/build/*" \
        ! -path "*/coverage/*" \
        -exec grep -l "$pattern" {} \; 2>/dev/null || true)
    
    if [ -n "$RESULTS" ]; then
        FOUND=true
        echo "$RESULTS" | while IFS= read -r file; do
            log_error "Ruta absoluta encontrada en: $file"
            # Mostrar las primeras 3 líneas que contienen el patrón
            grep -n "$pattern" "$file" 2>/dev/null | head -3 | while IFS= read -r line; do
                echo "   $line"
            done
            echo ""
        done
    fi
    
    if [ "$FOUND" = false ]; then
        log_success "No se encontraron rutas con patrón: $pattern"
    fi
done

# ═══════════════════════════════════════════════════════════════
# SYMLINKS EN CÓDIGO FUENTE
# ═══════════════════════════════════════════════════════════════

log_header "2. Verificando symlinks en código fuente"

SYMLINKS=$(find app -type l 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".yarn" || true)

if [ -n "$SYMLINKS" ]; then
    log_error "Symlinks encontrados en código fuente:"
    echo "$SYMLINKS" | while IFS= read -r symlink; do
        TARGET=$(readlink "$symlink" 2>/dev/null || echo "unknown")
        echo "   $symlink -> $TARGET"
        log_error "Symlink: $symlink"
    done
    echo ""
    log_info "Los symlinks deben ser reemplazados por archivos reales"
else
    log_success "No se encontraron symlinks en código fuente"
fi

# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE PATHS EN ARCHIVOS DE CONFIG
# ═══════════════════════════════════════════════════════════════

log_header "3. Verificando configuración de paths en archivos config"

# Verificar tsconfig.json
if [ -f "app/tsconfig.json" ]; then
    log_info "Verificando app/tsconfig.json"
    
    # Buscar rutas absolutas problemáticas en paths
    if grep -q "/opt/\|/home/\|/root/" app/tsconfig.json 2>/dev/null; then
        log_error "Rutas absolutas encontradas en tsconfig.json"
        grep "/opt/\|/home/\|/root/" app/tsconfig.json | head -5
    else
        log_success "tsconfig.json sin rutas absolutas problemáticas"
    fi
else
    log_warning "tsconfig.json no encontrado"
fi

# Verificar next.config.js
if [ -f "app/next.config.js" ]; then
    log_info "Verificando app/next.config.js"
    
    # Buscar rutas absolutas problemáticas
    if grep -q "/opt/\|/home/ubuntu\|/root/" app/next.config.js 2>/dev/null; then
        log_error "Rutas absolutas encontradas en next.config.js"
        grep "/opt/\|/home/ubuntu\|/root/" app/next.config.js | head -5
    else
        log_success "next.config.js sin rutas absolutas problemáticas"
    fi
else
    log_warning "next.config.js no encontrado"
fi

# Verificar package.json
if [ -f "app/package.json" ]; then
    log_info "Verificando app/package.json"
    
    # Buscar rutas absolutas en scripts
    if grep -q "/opt/\|/home/ubuntu\|/root/" app/package.json 2>/dev/null; then
        log_warning "Rutas absolutas encontradas en package.json"
        grep "/opt/\|/home/ubuntu\|/root/" app/package.json | head -5
        echo ""
        log_info "Verifica que los scripts usen rutas relativas"
    else
        log_success "package.json sin rutas absolutas problemáticas"
    fi
else
    log_error "package.json no encontrado"
fi

# ═══════════════════════════════════════════════════════════════
# IMPORTS CON RUTAS ABSOLUTAS
# ═══════════════════════════════════════════════════════════════

log_header "4. Verificando imports con rutas absolutas"

log_info "Buscando imports con rutas del sistema..."

# Buscar imports problemáticos en archivos TypeScript/JavaScript
IMPORT_ISSUES=$(find app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/.build/*" \
    -exec grep -l "from ['\"]\/opt\/\|from ['\"]\/home\/\|from ['\"]\/root\/" {} \; 2>/dev/null || true)

if [ -n "$IMPORT_ISSUES" ]; then
    log_error "Imports con rutas absolutas encontrados:"
    echo "$IMPORT_ISSUES" | while IFS= read -r file; do
        echo "   $file"
        grep -n "from ['\"]\/opt\/\|from ['\"]\/home\/\|from ['\"]\/root\/" "$file" | head -3
    done
else
    log_success "No se encontraron imports con rutas absolutas del sistema"
fi

# ═══════════════════════════════════════════════════════════════
# DOCKERFILE
# ═══════════════════════════════════════════════════════════════

log_header "5. Verificando Dockerfile"

if [ -f "Dockerfile" ]; then
    log_info "Verificando Dockerfile..."
    
    # Verificar que use rutas absolutas dentro del contenedor (/app)
    # Esto es CORRECTO en Dockerfile
    if grep -q "WORKDIR /app" Dockerfile; then
        log_success "WORKDIR /app configurado correctamente"
    else
        log_warning "WORKDIR /app no encontrado en Dockerfile"
    fi
    
    # Verificar que no use rutas del host
    if grep -q "/opt/hostedapp\|/home/ubuntu" Dockerfile; then
        log_error "Dockerfile contiene rutas del host"
        grep -n "/opt/hostedapp\|/home/ubuntu" Dockerfile
    else
        log_success "Dockerfile sin rutas del host"
    fi
    
    # Verificar uso de rutas relativas problemáticas
    if grep -q "RUN.*\./[a-z]" Dockerfile | grep -v "COPY\|ADD"; then
        log_warning "Posibles rutas relativas en comandos RUN"
        log_info "Considera usar rutas absolutas (/app/...) en lugar de relativas (./...)"
    fi
else
    log_error "Dockerfile no encontrado"
fi

# ═══════════════════════════════════════════════════════════════
# .DOCKERIGNORE
# ═══════════════════════════════════════════════════════════════

log_header "6. Verificando .dockerignore"

if [ -f ".dockerignore" ]; then
    log_success ".dockerignore encontrado"
    
    # Verificar que excluya rutas problemáticas
    SHOULD_IGNORE=(
        "node_modules"
        ".next"
        ".git"
        "*.log"
    )
    
    for item in "${SHOULD_IGNORE[@]}"; do
        if grep -q "^$item" .dockerignore; then
            log_success "$item está en .dockerignore"
        else
            log_warning "$item debería estar en .dockerignore"
        fi
    done
else
    log_warning ".dockerignore no encontrado (recomendado)"
fi

# ═══════════════════════════════════════════════════════════════
# RESUMEN
# ═══════════════════════════════════════════════════════════════

log_header "📊 RESUMEN DE VALIDACIÓN"

echo ""
echo -e "${YELLOW}Warnings encontrados: $WARNINGS${NC}"
echo -e "${RED}Errores encontrados: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    log_header "✅ VALIDACIÓN EXITOSA"
    echo ""
    echo "No se encontraron rutas absolutas problemáticas."
    echo "El código es portable y compatible con Docker."
    echo ""
    exit 0
else
    log_header "❌ VALIDACIÓN FALLÓ"
    echo ""
    echo "Se encontraron $ERRORS errores que deben ser corregidos."
    echo ""
    echo "SOLUCIONES:"
    echo ""
    echo "1. Rutas absolutas del host:"
    echo "   - Reemplaza /opt/hostedapp/... con rutas relativas"
    echo "   - Reemplaza /home/ubuntu/... con rutas relativas"
    echo "   - Usa paths de tsconfig.json para imports (@ aliases)"
    echo ""
    echo "2. Symlinks:"
    echo "   - Convierte symlinks a archivos reales"
    echo "   - Ejecuta: cp -L symlink archivo_real"
    echo "   - O usa: scripts/fix-yarn-lock-symlink.sh"
    echo ""
    echo "3. Imports:"
    echo "   - Usa imports relativos: import { X } from './file'"
    echo "   - Usa path aliases: import { X } from '@/lib/file'"
    echo ""
    exit 1
fi
