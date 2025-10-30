
#!/bin/bash

################################################################################
# Script de Diagnóstico de Base de Datos - EscalaFin
# 
# Propósito: Verificar conectividad y estado de PostgreSQL
################################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Funciones de utilidad
print_header() {
  echo -e "\n${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE} $1${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
  echo -e "\n${BOLD}${BLUE}$1${NC}"
  echo "────────────────────────────────────────────────────────────"
}

# Verificar que DATABASE_URL está configurada
check_env() {
  print_header "VERIFICACIÓN DE VARIABLES DE ENTORNO"
  
  if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL no está configurada"
    print_info "Por favor, configura DATABASE_URL en tus variables de entorno"
    exit 1
  else
    print_success "DATABASE_URL está configurada"
  fi
}

# Extraer componentes de la URL
extract_components() {
  print_section "Componentes de DATABASE_URL"
  
  if [[ $DATABASE_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
    
    # Remover parámetros de query si existen
    DB_NAME=$(echo "$DB_NAME" | cut -d'?' -f1)
    
    echo -e "  Usuario:     ${DB_USER}"
    echo -e "  Contraseña:  ${DB_PASSWORD:0:3}*** (${#DB_PASSWORD} caracteres)"
    echo -e "  Hostname:    ${DB_HOST}"
    echo -e "  Puerto:      ${DB_PORT}"
    echo -e "  Base Datos:  ${DB_NAME}"
  else
    print_error "No se pudo parsear DATABASE_URL"
    print_info "Formato esperado: postgres://user:pass@host:port/dbname"
    exit 1
  fi
}

# Verificar conectividad de red
check_network() {
  print_section "Verificación de Conectividad de Red"
  
  # Verificar resolución DNS
  print_info "Resolviendo ${DB_HOST}..."
  if host "$DB_HOST" >/dev/null 2>&1; then
    print_success "Hostname resuelto correctamente"
  else
    print_warning "No se pudo resolver el hostname (podría ser normal en redes internas)"
  fi
  
  # Verificar conectividad TCP
  print_info "Verificando conectividad TCP a ${DB_HOST}:${DB_PORT}..."
  if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null; then
    print_success "Puerto ${DB_PORT} accesible"
  else
    print_error "No se puede conectar al puerto ${DB_PORT}"
    print_warning "Verifica firewall y que el servidor esté corriendo"
  fi
}

# Verificar PostgreSQL
check_postgres() {
  print_section "Verificación de PostgreSQL"
  
  # Verificar si psql está instalado
  if ! command -v psql &> /dev/null; then
    print_warning "psql no está instalado, instalando..."
    if command -v apt-get &> /dev/null; then
      sudo apt-get update && sudo apt-get install -y postgresql-client
    else
      print_error "No se puede instalar postgresql-client automáticamente"
      exit 1
    fi
  fi
  
  # Intentar conexión
  print_info "Intentando conexión a la base de datos..."
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\conninfo' >/dev/null 2>&1; then
    print_success "Conexión exitosa a PostgreSQL"
    
    # Obtener información de la base de datos
    print_info "Obteniendo información de la base de datos..."
    DB_INFO=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "
      SELECT 
        version() as version,
        pg_database_size(current_database()) as size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables
    ")
    
    VERSION=$(echo "$DB_INFO" | cut -d'|' -f1)
    SIZE=$(echo "$DB_INFO" | cut -d'|' -f2)
    TABLES=$(echo "$DB_INFO" | cut -d'|' -f3)
    
    echo ""
    echo "  Versión: $VERSION"
    echo "  Tamaño:  $(numfmt --to=iec-i --suffix=B $SIZE 2>/dev/null || echo "$SIZE bytes")"
    echo "  Tablas:  $TABLES"
    
  else
    print_error "No se pudo conectar a PostgreSQL"
    print_info "Verifica las credenciales y que la base de datos esté accesible"
    exit 1
  fi
}

# Verificar tablas de EscalaFin
check_tables() {
  print_section "Verificación de Tablas EscalaFin"
  
  EXPECTED_TABLES=(
    "User"
    "Client"
    "Loan"
    "Payment"
    "CreditApplication"
    "PersonalReference"
  )
  
  for table in "${EXPECTED_TABLES[@]}"; do
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '$table'
      )" | grep -q 't'; then
      
      # Contar registros
      COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM \"$table\"")
      print_success "Tabla $table existe ($COUNT registros)"
    else
      print_warning "Tabla $table NO existe"
    fi
  done
}

# Verificar migraciones de Prisma
check_migrations() {
  print_section "Verificación de Migraciones Prisma"
  
  if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = '_prisma_migrations'
    )" | grep -q 't'; then
    
    MIGRATIONS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM _prisma_migrations")
    FAILED=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL")
    
    print_success "Sistema de migraciones Prisma configurado"
    echo "  Migraciones totales: $MIGRATIONS"
    if [ "$FAILED" -gt 0 ]; then
      print_warning "Migraciones fallidas: $FAILED"
    else
      print_success "Todas las migraciones exitosas"
    fi
  else
    print_warning "Tabla _prisma_migrations NO existe"
    print_info "Ejecuta 'yarn prisma migrate deploy' para inicializar"
  fi
}

# Resumen final
print_summary() {
  print_header "RESUMEN DEL DIAGNÓSTICO"
  
  echo "Estado de la base de datos: ${GREEN}OPERACIONAL${NC}"
  echo ""
  echo "Próximos pasos recomendados:"
  echo "  1. Si faltan tablas, ejecuta: yarn prisma migrate deploy"
  echo "  2. Si faltan datos, ejecuta: yarn prisma db seed"
  echo "  3. Para hacer backup: ./scripts/pg_backup.sh"
  echo ""
}

# Main
main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║      DIAGNÓSTICO DE BASE DE DATOS - ESCALAFIN MVP             ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  
  check_env
  extract_components
  check_network
  check_postgres
  check_tables
  check_migrations
  print_summary
}

# Ejecutar
main
