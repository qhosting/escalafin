
#!/bin/bash

# Script de Verificación Pre-Deploy para EscalaFin MVP
# Valida que todo esté listo antes de hacer push y rebuild en EasyPanel

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   VERIFICACIÓN PRE-DEPLOY - EscalaFin MVP                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((SUCCESS++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 - FALTA: $1"
        ((ERRORS++))
        return 1
    fi
}

# Función para verificar directorios
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((SUCCESS++))
        return 0
    else
        echo -e "${RED}✗${NC} $2 - FALTA: $1"
        ((ERRORS++))
        return 1
    fi
}

# Función para warning
check_warning() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((SUCCESS++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $2 - RECOMENDADO: $1"
        ((WARNINGS++))
        return 1
    fi
}

echo -e "${BLUE}═══ 1. VERIFICANDO ARCHIVOS CRÍTICOS ═══${NC}"
echo ""

# Archivos críticos del proyecto
check_file "app/package.json" "package.json principal"
check_file "app/package-lock.json" "package-lock.json sincronizado"
check_file "Dockerfile" "Dockerfile principal"
check_file "docker-compose.yml" "docker-compose.yml"
check_file "app/prisma/schema.prisma" "Prisma schema"
check_file "app/next.config.js" "Next.js config"
check_file "app/tsconfig.json" "TypeScript config"

echo ""
echo -e "${BLUE}═══ 2. SCRIPTS DE PRODUCCIÓN ═══${NC}"
echo ""

check_file "start-improved.sh" "Script de inicio mejorado"
check_file "emergency-start.sh" "Script de inicio de emergencia"
check_file "healthcheck.sh" "Script de healthcheck"
check_warning "app/scripts/setup-users-production.js" "Script de usuarios de prueba"
check_warning "app/scripts/seed.ts" "Script de seed de BD"

echo ""
echo -e "${BLUE}═══ 3. DIRECTORIOS ESENCIALES ═══${NC}"
echo ""

check_dir "app" "Directorio app/"
check_dir "app/components" "Directorio components/"
check_dir "app/lib" "Directorio lib/"
check_dir "app/api" "Directorio api/"
check_dir "app/prisma" "Directorio prisma/"
check_dir "app/scripts" "Directorio scripts/"
check_dir "app/public" "Directorio public/"

echo ""
echo -e "${BLUE}═══ 4. VERIFICANDO CONTENIDO DE DOCKERFILE ═══${NC}"
echo ""

# Verificar que el Dockerfile tenga las líneas críticas
if grep -q "WORKDIR /app" Dockerfile; then
    echo -e "${GREEN}✓${NC} WORKDIR configurado correctamente"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} WORKDIR no encontrado en Dockerfile"
    ((ERRORS++))
fi

if grep -q "package-lock.json" Dockerfile; then
    echo -e "${GREEN}✓${NC} package-lock.json referenciado en Dockerfile"
    ((SUCCESS++))
else
    echo -e "${YELLOW}⚠${NC} package-lock.json NO referenciado (puede causar problemas)"
    ((WARNINGS++))
fi

if grep -q "COPY start-improved.sh" Dockerfile || grep -q "COPY emergency-start.sh" Dockerfile; then
    echo -e "${GREEN}✓${NC} Scripts de inicio copiados en Dockerfile"
    ((SUCCESS++))
else
    echo -e "${RED}✗${NC} Scripts de inicio NO copiados en Dockerfile"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}═══ 5. VERIFICANDO .dockerignore ═══${NC}"
echo ""

if [ -f ".dockerignore" ]; then
    if ! grep -q "start-improved.sh" .dockerignore; then
        echo -e "${GREEN}✓${NC} start-improved.sh NO está ignorado (correcto)"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} start-improved.sh está siendo ignorado (ERROR)"
        ((ERRORS++))
    fi
    
    if ! grep -q "emergency-start.sh" .dockerignore; then
        echo -e "${GREEN}✓${NC} emergency-start.sh NO está ignorado (correcto)"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} emergency-start.sh está siendo ignorado (ERROR)"
        ((ERRORS++))
    fi
    
    if ! grep -q "healthcheck.sh" .dockerignore; then
        echo -e "${GREEN}✓${NC} healthcheck.sh NO está ignorado (correcto)"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} healthcheck.sh está siendo ignorado (ERROR)"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} .dockerignore no existe"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}═══ 6. VERIFICANDO SINCRONIZACIÓN DE DEPENDENCIAS ═══${NC}"
echo ""

# Verificar que package-lock.json esté sincronizado con package.json
cd app

if [ -f "package.json" ] && [ -f "package-lock.json" ]; then
    # Extraer dependencias críticas
    if grep -q "googleapis" package.json; then
        if grep -q "googleapis" package-lock.json; then
            echo -e "${GREEN}✓${NC} Google Drive: dependencias sincronizadas"
            ((SUCCESS++))
        else
            echo -e "${RED}✗${NC} Google Drive: falta en package-lock.json"
            echo -e "${YELLOW}   → Ejecutar: cd app && npm install${NC}"
            ((ERRORS++))
        fi
    fi
    
    if grep -q "@chatwoot/prosemirror-schema" package.json; then
        if grep -q "@chatwoot/prosemirror-schema" package-lock.json; then
            echo -e "${GREEN}✓${NC} Chatwoot: dependencias sincronizadas"
            ((SUCCESS++))
        else
            echo -e "${RED}✗${NC} Chatwoot: falta en package-lock.json"
            echo -e "${YELLOW}   → Ejecutar: cd app && npm install${NC}"
            ((ERRORS++))
        fi
    fi
fi

cd ..

echo ""
echo -e "${BLUE}═══ 7. VERIFICANDO ESTADO DEL REPOSITORIO ═══${NC}"
echo ""

# Verificar git status
if [ -d ".git" ]; then
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "${GREEN}✓${NC} No hay cambios sin commitear"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠${NC} Hay cambios sin commitear"
        echo -e "${YELLOW}   → Cambios pendientes:${NC}"
        git status --short | head -10
        ((WARNINGS++))
    fi
    
    # Verificar rama actual
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "${BLUE}   Rama actual: ${CURRENT_BRANCH}${NC}"
    
    # Verificar si hay commits sin push
    UNPUSHED=$(git log origin/${CURRENT_BRANCH}..HEAD --oneline 2>/dev/null | wc -l)
    if [ "$UNPUSHED" -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} Hay $UNPUSHED commit(s) sin hacer push"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓${NC} Todos los commits están en GitHub"
        ((SUCCESS++))
    fi
else
    echo -e "${RED}✗${NC} No es un repositorio Git"
    ((ERRORS++))
fi

echo ""
echo -e "${BLUE}═══ 8. PERMISOS DE SCRIPTS ═══${NC}"
echo ""

# Verificar permisos de ejecución
for script in start-improved.sh emergency-start.sh healthcheck.sh; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✓${NC} $script tiene permisos de ejecución"
            ((SUCCESS++))
        else
            echo -e "${YELLOW}⚠${NC} $script NO tiene permisos de ejecución"
            echo -e "${YELLOW}   → Ejecutar: chmod +x $script${NC}"
            ((WARNINGS++))
        fi
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  RESUMEN DE VERIFICACIÓN                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Exitosos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠ Advertencias: $WARNINGS${NC}"
echo -e "${RED}✗ Errores: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ TODO CORRECTO - LISTO PARA HACER PUSH Y REBUILD       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. git add ."
    echo "2. git commit -m 'mensaje'"
    echo "3. git push origin main"
    echo "4. En EasyPanel: Rebuild (limpiar cache si es necesario)"
    exit 0
elif [ $ERRORS -le 2 ] && [ $WARNINGS -le 3 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ ADVERTENCIA - REVISAR ANTES DE CONTINUAR              ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Hay algunos problemas menores. Revisa arriba y decide si continuar."
    exit 1
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ ERRORES CRÍTICOS - NO HACER PUSH TODAVÍA              ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Corrige los errores marcados arriba antes de hacer push."
    exit 2
fi
