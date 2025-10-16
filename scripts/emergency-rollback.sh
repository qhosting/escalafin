
#!/bin/bash

# 🚨 EMERGENCY ROLLBACK - EscalaFin MVP
# Restaura la aplicación a un estado anterior estable

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${RED}$1${NC}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Start
log_header "🚨 EMERGENCY ROLLBACK - EscalaFin MVP"

echo ""
log_warning "Este script realizará un ROLLBACK de emergencia."
log_warning "Se restaurará el código al último backup conocido."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "app" ]; then
    log_error "Error: No estás en el directorio del proyecto"
    log_info "Ejecuta desde: /home/ubuntu/escalafin_mvp"
    exit 1
fi

# Listar backups disponibles
log_info "Buscando backups disponibles..."
BACKUPS=$(ls -d /home/ubuntu/escalafin_mvp_BACKUP_* 2>/dev/null || echo "")

if [ -z "$BACKUPS" ]; then
    log_error "No se encontraron backups disponibles"
    log_info "No se puede realizar rollback automático"
    echo ""
    log_info "Opciones manuales:"
    log_info "  1. Revertir cambios en Git:"
    log_info "     git log --oneline -10"
    log_info "     git reset --hard <commit-hash>"
    log_info ""
    log_info "  2. Redeploy desde EasyPanel:"
    log_info "     Ve a Deployments > Redeploy último exitoso"
    exit 1
fi

echo ""
log_success "Backups encontrados:"
echo "$BACKUPS" | nl
echo ""

# Seleccionar el backup más reciente por defecto
LATEST_BACKUP=$(echo "$BACKUPS" | tail -1)
log_info "Backup más reciente: $LATEST_BACKUP"
echo ""

# Confirmación
read -p "¿Deseas restaurar desde este backup? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    log_info "Rollback cancelado por el usuario"
    exit 0
fi

# Crear backup del estado actual antes de rollback
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CURRENT_BACKUP="/home/ubuntu/escalafin_mvp_FAILED_$TIMESTAMP"

log_info "Creando backup del estado actual en: $CURRENT_BACKUP"
cp -r /home/ubuntu/escalafin_mvp "$CURRENT_BACKUP"
log_success "Backup del estado actual creado"

# Realizar rollback
log_info "Restaurando desde: $LATEST_BACKUP"

# Limpiar directorio actual (excepto .git)
log_info "Limpiando directorio actual..."
find /home/ubuntu/escalafin_mvp -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Copiar archivos desde backup
log_info "Copiando archivos desde backup..."
cp -r "$LATEST_BACKUP"/* /home/ubuntu/escalafin_mvp/
cp -r "$LATEST_BACKUP"/.* /home/ubuntu/escalafin_mvp/ 2>/dev/null || true

log_success "Archivos restaurados"

# Verificar archivos críticos
log_info "Verificando archivos críticos..."

CRITICAL_FILES=(
    "Dockerfile"
    "app/package.json"
    "app/next.config.js"
    "app/prisma/schema.prisma"
)

ALL_OK=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "$file ✓"
    else
        log_error "$file NO encontrado"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    log_error "Rollback incompleto - faltan archivos críticos"
    log_info "Revisa manualmente: $CURRENT_BACKUP"
    exit 1
fi

# Resumen
log_header "✅ ROLLBACK COMPLETADO"

echo ""
log_success "El código ha sido restaurado al estado anterior"
echo ""
log_info "Estado actual guardado en: $CURRENT_BACKUP"
log_info "Restaurado desde: $LATEST_BACKUP"
echo ""

log_warning "PRÓXIMOS PASOS:"
echo ""
echo "  1. Verifica el código restaurado:"
echo "     cd /home/ubuntu/escalafin_mvp"
echo "     git status"
echo ""
echo "  2. Si necesitas redeploy en EasyPanel:"
echo "     - Ve a EasyPanel > Tu App > Redeploy"
echo "     - O push a GitHub para trigger auto-deploy"
echo ""
echo "  3. Si el problema persiste:"
echo "     - Revisa logs en EasyPanel"
echo "     - Consulta ESTRATEGIA_DEPLOY_EASYPANEL.md"
echo "     - Verifica variables de entorno"
echo ""

log_success "Rollback completado exitosamente"
