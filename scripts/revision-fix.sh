
#!/bin/bash

# Script de Revisión de Fixes Aplicados
# Detecta problemas comunes que ya fueron corregidos previamente
# Para prevenir regresiones en futuros cambios

echo "============================================"
echo "🔍 REVISIÓN DE FIXES APLICADOS - EscalaFin"
echo "============================================"
echo ""

ERRORES=0
ADVERTENCIAS=0

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para reportar error
error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
    ((ERRORES++))
}

# Función para reportar advertencia
warning() {
    echo -e "${YELLOW}⚠️  ADVERTENCIA:${NC} $1"
    ((ADVERTENCIAS++))
}

# Función para reportar éxito
success() {
    echo -e "${GREEN}✅ OK:${NC} $1"
}

# Función para sección
section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

# ============================================
# 1. VERIFICAR RUTAS ABSOLUTAS
# ============================================
section "1. Verificación de Rutas Absolutas"

echo "Revisando schema.prisma..."
if grep -q "output.*=/app/" app/prisma/schema.prisma 2>/dev/null; then
    error "schema.prisma contiene ruta absoluta (/app/). Debe usar ruta relativa."
    echo "   Ubicación: app/prisma/schema.prisma"
    echo "   Cambiar: output = \"/app/...\" → output = \"../node_modules/.prisma/client\""
else
    success "schema.prisma no contiene rutas absolutas"
fi

echo "Revisando next.config.js..."
if grep -q "outputFileTracingRoot.*=.*'/app'" app/next.config.js 2>/dev/null; then
    warning "next.config.js contiene outputFileTracingRoot con /app. Puede causar problemas con yarn.lock"
    echo "   Ubicación: app/next.config.js"
elif grep -q "outputFileTracingRoot" app/next.config.js 2>/dev/null; then
    warning "next.config.js contiene outputFileTracingRoot. Verificar si es necesario."
else
    success "next.config.js no contiene outputFileTracingRoot problemático"
fi

# ============================================
# 2. VERIFICAR REFERENCIAS A YARN
# ============================================
section "2. Verificación de Referencias a Yarn (Proyecto usa NPM)"

echo "Revisando Dockerfile..."
if grep -q "COPY.*yarn.lock" Dockerfile 2>/dev/null; then
    error "Dockerfile COPIA yarn.lock (proyecto usa NPM)"
    echo "   Ubicación: Dockerfile"
    echo "   Buscar y eliminar: COPY yarn.lock"
    grep -n "COPY.*yarn" Dockerfile 2>/dev/null
elif grep -q "yarn.lock" Dockerfile 2>/dev/null && ! grep -q "Dummy yarn.lock" Dockerfile 2>/dev/null; then
    warning "Dockerfile menciona yarn.lock (verificar que sea intencional)"
    grep -n "yarn" Dockerfile 2>/dev/null | head -3
else
    success "Dockerfile maneja yarn.lock correctamente (dummy o no usa)"
fi

echo "Revisando .dockerignore..."
if grep -q "^yarn.lock$" .dockerignore 2>/dev/null; then
    warning ".dockerignore incluye yarn.lock en exclusiones"
else
    success ".dockerignore correcto respecto a yarn"
fi

echo "Revisando scripts de shell..."
YARN_IN_SCRIPTS=$(find . -name "*.sh" -type f -exec grep -l "yarn" {} \; 2>/dev/null | grep -v node_modules | grep -v ".git")
if [ ! -z "$YARN_IN_SCRIPTS" ]; then
    warning "Scripts shell contienen referencias a 'yarn':"
    echo "$YARN_IN_SCRIPTS" | while read file; do
        echo "   - $file"
    done
else
    success "Scripts shell no contienen referencias problemáticas a yarn"
fi

# ============================================
# 3. VERIFICAR SCRIPTS NECESARIOS
# ============================================
section "3. Verificación de Scripts Necesarios"

REQUIRED_SCRIPTS=(
    "app/scripts/setup-users-production.js"
    "app/scripts/seed.ts"
    "start-improved.sh"
    "emergency-start.sh"
    "healthcheck.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        error "Script necesario no encontrado: $script"
    else
        success "Script encontrado: $script"
    fi
done

# ============================================
# 4. VERIFICAR .dockerignore
# ============================================
section "4. Verificación de .dockerignore"

echo "Revisando exclusiones críticas..."

# Scripts que NO deben estar excluidos
CRITICAL_SCRIPTS=(
    "start-improved.sh"
    "emergency-start.sh"
    "healthcheck.sh"
)

for script in "${CRITICAL_SCRIPTS[@]}"; do
    if grep -q "^${script}$" .dockerignore 2>/dev/null; then
        error "$script está excluido en .dockerignore (NO debe estarlo)"
    else
        success "$script no está excluido en .dockerignore"
    fi
done

# Verificar que scripts/ folder esté incluido
if grep -q "^scripts/$" .dockerignore 2>/dev/null || grep -q "^scripts$" .dockerignore 2>/dev/null; then
    error "Carpeta scripts/ está excluida en .dockerignore (debe estar incluida)"
else
    success "Carpeta scripts/ no está excluida"
fi

# ============================================
# 5. VERIFICAR DEPENDENCIAS CRÍTICAS
# ============================================
section "5. Verificación de Dependencias Críticas"

CRITICAL_DEPS=(
    "bcryptjs"
    "jsonwebtoken"
    "next-auth"
    "@prisma/client"
)

for dep in "${CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" app/package.json 2>/dev/null; then
        success "Dependencia encontrada: $dep"
    else
        error "Dependencia crítica no encontrada en package.json: $dep"
    fi
done

# ============================================
# 6. VERIFICAR NODE_PATH EN SCRIPTS
# ============================================
section "6. Verificación de NODE_PATH en Scripts de Inicio"

if [ -f "start-improved.sh" ]; then
    if grep -q "NODE_PATH" start-improved.sh; then
        success "start-improved.sh configura NODE_PATH"
    else
        warning "start-improved.sh no configura NODE_PATH (puede causar problemas con módulos)"
        echo "   Añadir: export NODE_PATH=/app/node_modules"
    fi
fi

# ============================================
# 7. VERIFICAR ESTRUCTURA DOCKERFILE
# ============================================
section "7. Verificación de Estructura del Dockerfile"

if [ -f "Dockerfile" ]; then
    echo "Verificando stages..."
    
    if grep -q "FROM.*AS builder" Dockerfile; then
        success "Dockerfile usa multi-stage build"
    else
        warning "Dockerfile no parece usar multi-stage build"
    fi
    
    if grep -q "COPY.*scripts.*/" Dockerfile; then
        success "Dockerfile copia carpeta scripts/"
    else
        error "Dockerfile no copia carpeta scripts/"
    fi
    
    if grep -q "COPY.*start-improved.sh" Dockerfile || grep -q "COPY \*\.sh" Dockerfile; then
        success "Dockerfile copia scripts de inicio .sh"
    else
        warning "Dockerfile podría no estar copiando scripts .sh"
    fi
    
    # Verificar que no se copie yarn.lock
    if grep -q "COPY.*yarn.lock" Dockerfile; then
        error "Dockerfile copia yarn.lock (proyecto usa NPM)"
    else
        success "Dockerfile no copia yarn.lock"
    fi
fi

# ============================================
# 8. VERIFICAR PRISMA CONFIGURATION
# ============================================
section "8. Verificación de Configuración Prisma"

if [ -f "app/prisma/schema.prisma" ]; then
    echo "Revisando generador Prisma..."
    
    if grep -q 'output.*=.*"\.\./node_modules/\.prisma/client"' app/prisma/schema.prisma; then
        success "Prisma generator usa ruta relativa correcta"
    elif grep -q 'output.*=' app/prisma/schema.prisma; then
        warning "Prisma generator tiene output personalizado, verificar que sea correcto"
        grep "output" app/prisma/schema.prisma
    else
        success "Prisma generator usa output por defecto"
    fi
fi

# ============================================
# 9. VERIFICAR VARIABLES DE ENTORNO NECESARIAS
# ============================================
section "9. Verificación de Variables de Entorno"

REQUIRED_ENV_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

echo "Verificando que estén documentadas..."
if [ -f ".env.example" ] || [ -f "VARIABLES_ENTORNO_COMPLETAS.md" ]; then
    success "Archivo de documentación de variables encontrado"
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "$var" .env.example 2>/dev/null || grep -q "$var" VARIABLES_ENTORNO_COMPLETAS.md 2>/dev/null; then
            success "Variable documentada: $var"
        else
            warning "Variable no documentada: $var"
        fi
    done
else
    warning "No se encontró archivo de documentación de variables de entorno"
fi

# ============================================
# 10. VERIFICAR PACKAGE MANAGER
# ============================================
section "10. Verificación de Package Manager (NPM vs Yarn)"

if [ -f "app/package-lock.json" ]; then
    success "Proyecto usa NPM (package-lock.json encontrado)"
    
    if [ -f "app/yarn.lock" ]; then
        error "Proyecto tiene tanto package-lock.json como yarn.lock (conflicto)"
        echo "   Acción: Eliminar yarn.lock si se usa NPM"
    fi
else
    warning "No se encontró package-lock.json"
fi

# ============================================
# RESUMEN FINAL
# ============================================
echo ""
echo "============================================"
echo "📊 RESUMEN DE REVISIÓN"
echo "============================================"
echo -e "${RED}Errores encontrados: $ERRORES${NC}"
echo -e "${YELLOW}Advertencias encontradas: $ADVERTENCIAS${NC}"
echo ""

if [ $ERRORES -eq 0 ] && [ $ADVERTENCIAS -eq 0 ]; then
    echo -e "${GREEN}✨ ¡Todo está en orden! No se encontraron problemas.${NC}"
    exit 0
elif [ $ERRORES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Se encontraron advertencias pero no errores críticos.${NC}"
    exit 0
else
    echo -e "${RED}❌ Se encontraron errores críticos que deben ser corregidos.${NC}"
    echo ""
    echo "Recomendaciones:"
    echo "1. Corregir los errores listados arriba"
    echo "2. Ejecutar nuevamente este script para verificar"
    echo "3. Hacer commit y push de los cambios"
    echo "4. Reconstruir en EasyPanel con caché limpio"
    exit 1
fi
