
#!/bin/bash

################################################################################
# Script de Backup PostgreSQL - EscalaFin
# 
# Propósito: Crear backups automáticos de la base de datos PostgreSQL
################################################################################

set -e

# Configuración
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE} $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  print_error "DATABASE_URL no está configurada"
  exit 1
fi

# Extraer componentes
if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASSWORD="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME=$(echo "${BASH_REMATCH[5]}" | cut -d'?' -f1)
else
  print_error "No se pudo parsear DATABASE_URL"
  exit 1
fi

print_header "BACKUP DE BASE DE DATOS - ESCALAFIN"

echo "Base de datos: $DB_NAME"
echo "Host:          $DB_HOST"
echo "Timestamp:     $TIMESTAMP"
echo ""

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"
print_success "Directorio de backups: $BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="$BACKUP_DIR/escalafin_${DB_NAME}_${TIMESTAMP}.sql"

# Crear backup
print_info "Creando backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  print_success "Backup creado: $BACKUP_FILE"
  
  # Comprimir
  print_info "Comprimiendo backup..."
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"
  
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  print_success "Backup comprimido: $BACKUP_FILE ($FILE_SIZE)"
else
  print_error "Error al crear backup"
  exit 1
fi

# Limpiar backups antiguos
print_info "Limpiando backups antiguos (>$RETENTION_DAYS días)..."
find "$BACKUP_DIR" -name "escalafin_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "escalafin_*.sql.gz" | wc -l)
print_success "Backups totales: $REMAINING"

echo ""
print_header "BACKUP COMPLETADO"
echo "Archivo: $BACKUP_FILE"
echo "Tamaño:  $FILE_SIZE"
echo ""
