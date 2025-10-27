
#!/bin/bash

echo "🔍 VERIFICACIÓN PRE-DEPLOY - EscalaFin MVP"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Verificar Git
echo "1️⃣  Verificando estado de Git..."
cd /home/ubuntu/escalafin_mvp

if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✅ No hay cambios sin commitear${NC}"
else
    echo -e "${YELLOW}⚠️  Hay cambios sin commitear${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s")
echo "   Último commit: $LAST_COMMIT"
echo ""

# 2. Verificar yarn.lock
echo "2️⃣  Verificando yarn.lock..."
if [ -L "app/yarn.lock" ]; then
    echo -e "${RED}❌ yarn.lock es un symlink - Docker fallará${NC}"
    ERRORS=$((ERRORS + 1))
else
    SIZE=$(du -h app/yarn.lock | cut -f1)
    echo -e "${GREEN}✅ yarn.lock es un archivo regular (${SIZE})${NC}"
fi
echo ""

# 3. Verificar estructura de layout.tsx
echo "3️⃣  Verificando app/app/layout.tsx..."
if grep -q "export const dynamic" app/app/layout.tsx; then
    # Verificar que está después de los imports
    LINE_DYNAMIC=$(grep -n "export const dynamic" app/app/layout.tsx | head -1 | cut -d: -f1)
    LINE_LAST_IMPORT=$(grep -n "^import" app/app/layout.tsx | tail -1 | cut -d: -f1)
    
    if [ "$LINE_DYNAMIC" -gt "$LINE_LAST_IMPORT" ]; then
        echo -e "${GREEN}✅ 'export const dynamic' está bien posicionado (línea $LINE_DYNAMIC)${NC}"
    else
        echo -e "${RED}❌ 'export const dynamic' está mal posicionado (línea $LINE_DYNAMIC, debería estar después de línea $LINE_LAST_IMPORT)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  No se encontró 'export const dynamic'${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 4. Verificar Dockerfile
echo "4️⃣  Verificando Dockerfile..."
if grep -q "yarn build 2>&1 | tee" Dockerfile; then
    echo -e "${YELLOW}⚠️  Dockerfile usa logging complejo (puede ocultar errores)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Dockerfile usa comando de build simple${NC}"
fi
echo ""

# 5. Verificar archivos críticos
echo "5️⃣  Verificando archivos críticos..."
CRITICAL_FILES=(
    "Dockerfile"
    "app/package.json"
    "app/yarn.lock"
    "app/next.config.js"
    "app/tsconfig.json"
    "app/prisma/schema.prisma"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ FALTA: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# 6. Verificar configuración de Next.js
echo "6️⃣  Verificando next.config.js..."
if grep -q "output.*standalone\|output.*NEXT_OUTPUT_MODE" app/next.config.js; then
    echo -e "${GREEN}✅ output configurado para standalone${NC}"
else
    echo -e "${RED}❌ output: 'standalone' no configurado${NC}"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "outputFileTracingRoot" app/next.config.js; then
    echo -e "${GREEN}✅ outputFileTracingRoot configurado${NC}"
else
    echo -e "${YELLOW}⚠️  outputFileTracingRoot no configurado${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Verificar variables de entorno en README
echo "7️⃣  Verificando documentación de variables de entorno..."
if [ -f "VARIABLES_ENTORNO_COMPLETAS.md" ]; then
    echo -e "${GREEN}✅ Documentación de variables disponible${NC}"
else
    echo -e "${YELLOW}⚠️  Falta documentación de variables${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Resumen
echo "=========================================="
echo "📊 RESUMEN"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TODO PERFECTO - LISTO PARA DEPLOY${NC}"
    echo ""
    echo "Próximos pasos en EasyPanel:"
    echo "1. Limpiar Build Cache"
    echo "2. Verificar que usa commit: $(git rev-parse --short HEAD)"
    echo "3. Rebuild"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS advertencia(s) - Puedes deployar pero revisa las advertencias${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(es) crítico(s)${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS advertencia(s)${NC}"
    echo ""
    echo "❌ NO DEPLOYAR - Corrige los errores primero"
    exit 1
fi
