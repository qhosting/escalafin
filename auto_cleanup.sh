
#!/bin/bash
# Script de limpieza automática (sin confirmación)
set -e

echo "🧹 LIMPIEZA AUTOMÁTICA DE ESCALAFIN MVP"
echo "======================================="
echo ""

mkdir -p cleanup_logs
LOG="cleanup_logs/auto_cleanup_$(date +%Y%m%d_%H%M%S).log"

echo "📝 Log: $LOG"
echo ""

# Paso 1: Eliminar instances/demo/
echo "🗑️  PASO 1: Eliminando /instances/demo/"
if [ -d "instances" ]; then
    DEMO_FILES=$(find instances -type f 2>/dev/null | wc -l)
    echo "  - Archivos encontrados: $DEMO_FILES"
    rm -rf instances/
    echo "  ✅ instances/ eliminado" | tee -a "$LOG"
else
    echo "  ℹ️  instances/ no existe"
fi
echo ""

# Paso 2: Listar archivos en raíz (excepto esenciales)
echo "🗑️  PASO 2: Eliminando documentación redundante en raíz"

# Archivos que DEBEN mantenerse
KEEP_FILES=(
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "SECURITY.md"
    ".gitignore"
    ".dockerignore"
    "Dockerfile"
    "Dockerfile.backup-v16-npm"
    "Dockerfile.coolify"
    "Dockerfile.easypanel"
    "Dockerfile.production"
    "docker-compose.yml"
    "docker-compose.easypanel.yml"
    "docker-compose.coolify.yml"
    "start-improved.sh"
    "emergency-start.sh"
    "healthcheck.sh"
    "start.sh"
    "auto_cleanup.sh"
    "cleanup_project.sh"
)

# Crear patrón de exclusión para find
EXCLUDE_PATTERN=""
for file in "${KEEP_FILES[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN ! -name '$file'"
done

# Contar archivos a eliminar
DOCS_TO_DELETE=$(find . -maxdepth 1 -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.txt" \) ! -name "README.md" ! -name "LICENSE" ! -name "CONTRIBUTING.md" ! -name "SECURITY.md" 2>/dev/null | wc -l)

echo "  - Archivos de documentación a eliminar: $DOCS_TO_DELETE"

# Eliminar archivos .md (excepto los esenciales)
find . -maxdepth 1 -type f -name "*.md" \
    ! -name "README.md" \
    ! -name "CONTRIBUTING.md" \
    ! -name "SECURITY.md" \
    -delete 2>/dev/null

# Eliminar todos los PDFs en raíz
find . -maxdepth 1 -type f -name "*.pdf" -delete 2>/dev/null

# Eliminar archivos .txt en raíz (excepto algunos críticos)
find . -maxdepth 1 -type f -name "*.txt" \
    ! -name "package.txt" \
    -delete 2>/dev/null

echo "  ✅ Documentación redundante eliminada" | tee -a "$LOG"
echo ""

# Paso 3: Limpiar scripts redundantes
echo "🗑️  PASO 3: Limpiando scripts redundantes"

# Mantener solo scripts esenciales
ESSENTIAL_SCRIPTS=(
    "start-improved.sh"
    "emergency-start.sh"
    "healthcheck.sh"
    "start.sh"
    "start-easypanel.sh"
    "backup-db.sh"
    "restore-db.sh"
)

SCRIPTS_DELETED=0
for script in *.sh; do
    if [[ -f "$script" ]]; then
        KEEP=false
        for essential in "${ESSENTIAL_SCRIPTS[@]}" "auto_cleanup.sh" "cleanup_project.sh"; do
            if [[ "$script" == "$essential" ]]; then
                KEEP=true
                break
            fi
        done
        
        if [[ "$KEEP" == false ]]; then
            rm "$script"
            echo "  - Eliminado: $script" >> "$LOG"
            ((SCRIPTS_DELETED++))
        fi
    fi
done

echo "  - Scripts eliminados: $SCRIPTS_DELETED"
echo "  ✅ Scripts redundantes eliminados" | tee -a "$LOG"
echo ""

# Paso 4: Limpiar Dockerfiles redundantes
echo "🗑️  PASO 4: Limpiando Dockerfiles redundantes"

ESSENTIAL_DOCKERFILES=(
    "Dockerfile"
    "Dockerfile.coolify"
    "Dockerfile.easypanel"
)

DOCKERFILES_DELETED=0
for dockerfile in Dockerfile.*; do
    if [[ -f "$dockerfile" ]]; then
        KEEP=false
        for essential in "${ESSENTIAL_DOCKERFILES[@]}"; do
            if [[ "$dockerfile" == "$essential" ]]; then
                KEEP=true
                break
            fi
        done
        
        if [[ "$KEEP" == false ]]; then
            rm "$dockerfile"
            echo "  - Eliminado: $dockerfile" >> "$LOG"
            ((DOCKERFILES_DELETED++))
        fi
    fi
done

echo "  - Dockerfiles eliminados: $DOCKERFILES_DELETED"
echo "  ✅ Dockerfiles redundantes eliminados" | tee -a "$LOG"
echo ""

# Paso 5: Limpiar docker-compose redundantes
echo "🗑️  PASO 5: Limpiando docker-compose redundantes"

COMPOSE_DELETED=0
for compose in docker-compose.*.yml; do
    if [[ -f "$compose" && "$compose" != "docker-compose.coolify.yml" && "$compose" != "docker-compose.easypanel.yml" ]]; then
        rm "$compose"
        echo "  - Eliminado: $compose" >> "$LOG"
        ((COMPOSE_DELETED++))
    fi
done

echo "  - Docker-compose eliminados: $COMPOSE_DELETED"
echo "  ✅ Archivos docker-compose redundantes eliminados" | tee -a "$LOG"
echo ""

# Resumen final
echo "✅ LIMPIEZA COMPLETADA"
echo "===================="
echo ""
echo "Resumen:"
echo "  ✓ instances/ eliminado"
echo "  ✓ $DOCS_TO_DELETE archivos de documentación eliminados"
echo "  ✓ $SCRIPTS_DELETED scripts redundantes eliminados"
echo "  ✓ $DOCKERFILES_DELETED Dockerfiles redundantes eliminados"
echo "  ✓ $COMPOSE_DELETED docker-compose redundantes eliminados"
echo ""
echo "Archivos mantenidos:"
echo "  ✓ README.md, LICENSE, CONTRIBUTING.md, SECURITY.md"
echo "  ✓ Dockerfile, Dockerfile.coolify, Dockerfile.easypanel"
echo "  ✓ docker-compose.yml, docker-compose.coolify.yml, docker-compose.easypanel.yml"
echo "  ✓ start-improved.sh, emergency-start.sh, healthcheck.sh"
echo "  ✓ Carpeta app/ (completa)"
echo "  ✓ Carpeta scripts/ (completa)"
echo ""
echo "📋 Log detallado: $LOG"
echo ""
echo "🎯 Estado actual del proyecto:"
find . -maxdepth 1 -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.txt" -o -name "*.sh" \) ! -path "./.git/*" | wc -l | xargs -I {} echo "  - Archivos de documentación/scripts en raíz: {}"
echo ""
