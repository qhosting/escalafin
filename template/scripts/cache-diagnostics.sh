
#!/bin/bash

# Script de Diagnóstico de Problemas de Cache en EasyPanel
# Detecta problemas comunes causados por cache de construcción

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   DIAGNÓSTICO DE CACHE - EscalaFin MVP                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══ SÍNTOMAS COMUNES DE PROBLEMAS DE CACHE ═══${NC}"
echo ""

CACHE_ISSUES=0

# 1. Verificar timestamps de archivos críticos
echo -e "${BLUE}1. Verificando timestamps de archivos críticos...${NC}"

if [ -f "Dockerfile" ]; then
    DOCKERFILE_DATE=$(stat -c %Y Dockerfile 2>/dev/null || stat -f %m Dockerfile 2>/dev/null)
    echo "   Dockerfile modificado: $(date -r Dockerfile 2>/dev/null || date -r Dockerfile '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
fi

if [ -f "app/package.json" ]; then
    PACKAGE_DATE=$(stat -c %Y app/package.json 2>/dev/null || stat -f %m app/package.json 2>/dev/null)
    echo "   package.json modificado: $(date -r app/package.json 2>/dev/null || date -r app/package.json '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
fi

if [ -f "app/package-lock.json" ]; then
    LOCK_DATE=$(stat -c %Y app/package-lock.json 2>/dev/null || stat -f %m app/package-lock.json 2>/dev/null)
    echo "   package-lock.json modificado: $(date -r app/package-lock.json 2>/dev/null || date -r app/package-lock.json '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
    
    # Verificar si package-lock.json es más antiguo que package.json
    if [ "$LOCK_DATE" -lt "$PACKAGE_DATE" ]; then
        echo -e "${RED}   ⚠ PROBLEMA: package-lock.json es más antiguo que package.json${NC}"
        echo -e "${YELLOW}     → Esto causará errores en EasyPanel${NC}"
        echo -e "${YELLOW}     → Solución: cd app && npm install${NC}"
        ((CACHE_ISSUES++))
    else
        echo -e "${GREEN}   ✓ package-lock.json está actualizado${NC}"
    fi
fi

echo ""

# 2. Verificar último commit vs último push
echo -e "${BLUE}2. Verificando sincronización con GitHub...${NC}"

if [ -d ".git" ]; then
    LAST_COMMIT=$(git log -1 --format="%h - %s" 2>/dev/null)
    echo "   Último commit local: $LAST_COMMIT"
    
    CURRENT_BRANCH=$(git branch --show-current)
    UNPUSHED=$(git log origin/${CURRENT_BRANCH}..HEAD --oneline 2>/dev/null | wc -l)
    
    if [ "$UNPUSHED" -gt 0 ]; then
        echo -e "${RED}   ⚠ PROBLEMA: Hay $UNPUSHED commit(s) sin hacer push${NC}"
        echo -e "${YELLOW}     → EasyPanel está usando código antiguo${NC}"
        echo -e "${YELLOW}     → Solución: git push origin ${CURRENT_BRANCH}${NC}"
        ((CACHE_ISSUES++))
    else
        echo -e "${GREEN}   ✓ Todo está en GitHub${NC}"
    fi
    
    # Verificar último commit en GitHub
    LAST_REMOTE_COMMIT=$(git log origin/${CURRENT_BRANCH} -1 --format="%h - %s" 2>/dev/null)
    echo "   Último commit en GitHub: $LAST_REMOTE_COMMIT"
else
    echo -e "${RED}   ✗ No es un repositorio Git${NC}"
fi

echo ""

# 3. Verificar si hay archivos críticos modificados sin commitear
echo -e "${BLUE}3. Verificando cambios sin commitear...${NC}"

if [ -d ".git" ]; then
    MODIFIED_CRITICAL=$(git status --porcelain | grep -E "(Dockerfile|package\.json|package-lock\.json|\.dockerignore|start-improved\.sh|emergency-start\.sh)" | wc -l)
    
    if [ "$MODIFIED_CRITICAL" -gt 0 ]; then
        echo -e "${RED}   ⚠ PROBLEMA: Hay archivos críticos modificados sin commitear${NC}"
        echo ""
        git status --porcelain | grep -E "(Dockerfile|package\.json|package-lock\.json|\.dockerignore|start-improved\.sh|emergency-start\.sh)"
        echo ""
        echo -e "${YELLOW}     → EasyPanel NO verá estos cambios${NC}"
        echo -e "${YELLOW}     → Solución: git add . && git commit && git push${NC}"
        ((CACHE_ISSUES++))
    else
        echo -e "${GREEN}   ✓ No hay cambios críticos pendientes${NC}"
    fi
fi

echo ""

# 4. Verificar coherencia de Dockerfile
echo -e "${BLUE}4. Verificando coherencia del Dockerfile...${NC}"

if [ -f "Dockerfile" ]; then
    # Verificar que los archivos que copia el Dockerfile existan
    MISSING_FILES=0
    
    # Extraer archivos COPY del Dockerfile de forma más simple
    COPY_FILES=$(grep "^COPY " Dockerfile | awk '{print $2}' | grep -v "^\." | grep -v "^--")
    
    if [ -n "$COPY_FILES" ]; then
        for FILE in $COPY_FILES; do
            if [ ! -f "$FILE" ] && [ ! -d "$FILE" ]; then
                echo -e "${RED}   ⚠ Archivo referenciado pero no existe: $FILE${NC}"
                MISSING_FILES=$((MISSING_FILES + 1))
            fi
        done
    fi
    
    if [ $MISSING_FILES -gt 0 ]; then
        echo -e "${RED}   ⚠ PROBLEMA: $MISSING_FILES archivo(s) faltantes${NC}"
        echo -e "${YELLOW}     → El build en EasyPanel fallará${NC}"
        CACHE_ISSUES=$((CACHE_ISSUES + 1))
    else
        echo -e "${GREEN}   ✓ Todos los archivos del Dockerfile existen${NC}"
    fi
fi

echo ""

# 5. Buscar síntomas de uso de cache antiguo
echo -e "${BLUE}5. Buscando síntomas de cache antiguo...${NC}"

if [ -f ".git/logs/HEAD" ]; then
    LAST_ACTIVITY=$(tail -1 .git/logs/HEAD | awk '{print $5, $6, $7, $8, $9}')
    echo "   Última actividad en repo: $LAST_ACTIVITY"
    
    # Si la última actividad fue hace más de 1 hora pero hay commits recientes
    LAST_COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - LAST_COMMIT_TIME))
    
    if [ $TIME_DIFF -lt 3600 ]; then
        echo -e "${GREEN}   ✓ Actividad reciente (hace menos de 1 hora)${NC}"
    else
        HOURS=$((TIME_DIFF / 3600))
        echo -e "${YELLOW}   ⚠ Último commit hace $HOURS hora(s)${NC}"
        echo -e "${YELLOW}     → Si acabas de hacer cambios, verifica que estén commiteados${NC}"
    fi
fi

echo ""

# 6. Generar hash de archivos críticos
echo -e "${BLUE}6. Generando hashes de verificación...${NC}"
echo ""
echo "   Usa estos hashes para verificar que EasyPanel tiene la versión correcta:"
echo ""

if [ -f "Dockerfile" ]; then
    DOCKERFILE_HASH=$(md5sum Dockerfile 2>/dev/null || md5 Dockerfile 2>/dev/null)
    echo "   Dockerfile: $DOCKERFILE_HASH"
fi

if [ -f "app/package.json" ]; then
    PACKAGE_HASH=$(md5sum app/package.json 2>/dev/null || md5 app/package.json 2>/dev/null)
    echo "   package.json: $PACKAGE_HASH"
fi

if [ -f "app/package-lock.json" ]; then
    LOCK_HASH=$(md5sum app/package-lock.json 2>/dev/null || md5 app/package-lock.json 2>/dev/null)
    echo "   package-lock.json: $LOCK_HASH"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  RESUMEN DEL DIAGNÓSTICO                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $CACHE_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ NO se detectaron problemas de cache${NC}"
    echo ""
    echo "Si EasyPanel sigue mostrando versión antigua:"
    echo "1. Ve a EasyPanel → Tu servicio"
    echo "2. Haz clic en 'Rebuild'"
    echo "3. ANTES de rebuild, activa 'Clear build cache'"
    echo "4. Luego haz clic en 'Rebuild'"
else
    echo -e "${RED}⚠ Se detectaron $CACHE_ISSUES problema(s) que pueden causar cache antiguo${NC}"
    echo ""
    echo "Acciones recomendadas:"
    echo "1. Corrige los problemas indicados arriba"
    echo "2. Haz commit y push de todos los cambios"
    echo "3. En EasyPanel: Clear build cache + Rebuild"
fi

echo ""
