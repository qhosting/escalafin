
#!/bin/bash
# Script de limpieza segura del proyecto EscalaFin
# Fecha: $(date +%Y-%m-%d)

set -e

echo "🧹 INICIANDO LIMPIEZA SEGURA DE ESCALAFIN MVP"
echo "============================================="
echo ""

# Crear directorio para logs
mkdir -p cleanup_logs
LOG_FILE="cleanup_logs/cleanup_$(date +%Y%m%d_%H%M%S).log"

# Función para logging
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log "Fecha: $(date)"
log ""
log "=== PASO 1: IDENTIFICAR ARCHIVOS ESENCIALES ==="
log ""

# Archivos esenciales que DEBEN mantenerse
ESSENTIAL_FILES=(
    "README.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "SECURITY.md"
    ".gitignore"
    ".dockerignore"
    "Dockerfile"
    "docker-compose.yml"
    "package.json"
    "package-lock.json"
    "start-improved.sh"
    "emergency-start.sh"
    "healthcheck.sh"
)

# Directorios esenciales que DEBEN mantenerse completamente
ESSENTIAL_DIRS=(
    "app"
    "scripts"
    ".git"
    ".github"
)

log "Archivos esenciales marcados:"
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "  ✓ $file"
    else
        log "  ⚠ $file (no existe)"
    fi
done
log ""

log "Directorios esenciales marcados:"
for dir in "${ESSENTIAL_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log "  ✓ $dir/"
    else
        log "  ⚠ $dir/ (no existe)"
    fi
done
log ""

log "=== PASO 2: ELIMINAR /instances/demo/ ==="
log ""

if [ -d "instances/demo" ]; then
    log "📁 Eliminando instances/demo/..."
    # Listar archivos que se eliminarán
    find instances/demo -type f | tee -a "$LOG_FILE" | wc -l | xargs -I {} log "  {} archivos encontrados"
    rm -rf instances/demo
    log "  ✅ instances/demo/ eliminado"
else
    log "  ℹ instances/demo/ no existe"
fi
log ""

log "=== PASO 3: ELIMINAR DOCUMENTACIÓN REDUNDANTE ==="
log ""

# Crear lista de archivos a eliminar
TO_DELETE_LOG="cleanup_logs/files_to_delete_$(date +%Y%m%d_%H%M%S).txt"

log "Generando lista de archivos a eliminar..."

# Encontrar archivos de documentación redundantes (en raíz)
find . -maxdepth 1 -type f \( \
    -name "*.md" -o \
    -name "*.pdf" -o \
    -name "*.txt" -o \
    -name "*.sh" \
\) ! -name "README.md" \
   ! -name "CONTRIBUTING.md" \
   ! -name "SECURITY.md" \
   ! -name "LICENSE" \
   ! -name "start-improved.sh" \
   ! -name "emergency-start.sh" \
   ! -name "healthcheck.sh" \
   ! -name ".gitignore" \
   ! -name ".dockerignore" > "$TO_DELETE_LOG"

# Contar archivos a eliminar
TOTAL_TO_DELETE=$(wc -l < "$TO_DELETE_LOG")
log "  📋 $TOTAL_TO_DELETE archivos de documentación redundantes encontrados"
log ""

log "=== PASO 4: CONFIRMAR ELIMINACIÓN ==="
log ""
log "Archivos que se eliminarán (primeros 20):"
head -20 "$TO_DELETE_LOG" | while read file; do
    log "  - $file"
done

if [ $TOTAL_TO_DELETE -gt 20 ]; then
    log "  ... y $(($TOTAL_TO_DELETE - 20)) más"
fi
log ""

log "Lista completa guardada en: $TO_DELETE_LOG"
log ""

echo ""
echo "⚠️  ATENCIÓN: Se eliminarán $TOTAL_TO_DELETE archivos"
echo ""
echo "Archivos esenciales que SE MANTENDRÁN:"
echo "  - README.md, LICENSE, CONTRIBUTING.md, SECURITY.md"
echo "  - Dockerfile, docker-compose.yml"
echo "  - start-improved.sh, emergency-start.sh, healthcheck.sh"
echo "  - Carpeta app/ completa"
echo "  - Carpeta scripts/ completa"
echo ""
read -p "¿Continuar con la eliminación? (sí/no): " confirm

if [ "$confirm" = "sí" ] || [ "$confirm" = "si" ] || [ "$confirm" = "yes" ]; then
    log "=== PASO 5: EJECUTANDO ELIMINACIÓN ==="
    log ""
    
    while read file; do
        if [ -f "$file" ]; then
            rm "$file"
            log "  ✓ Eliminado: $file"
        fi
    done < "$TO_DELETE_LOG"
    
    log ""
    log "✅ LIMPIEZA COMPLETADA"
    log ""
    log "Resumen:"
    log "  - Archivos eliminados: $TOTAL_TO_DELETE"
    log "  - Carpeta instances/demo/: Eliminada"
    log "  - Archivos esenciales: Mantenidos"
    log ""
    log "Logs guardados en: $LOG_FILE"
    log "Lista de archivos eliminados: $TO_DELETE_LOG"
    
else
    log "❌ ELIMINACIÓN CANCELADA POR EL USUARIO"
    exit 1
fi

echo ""
echo "✅ Script completado. Ver logs en: $LOG_FILE"
