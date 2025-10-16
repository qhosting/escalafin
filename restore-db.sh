
#!/bin/bash

# Script para restaurar backup de PostgreSQL de EscalaFin
# Autor: DeepAgent
# Fecha: 16 de octubre de 2025

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="/backup-escalafin"

echo -e "${YELLOW}⚠️ ADVERTENCIA: Este proceso restaurará la base de datos desde un backup${NC}"
echo -e "${YELLOW}⚠️ Todos los datos actuales serán REEMPLAZADOS${NC}"
echo ""

# Listar backups disponibles
echo -e "${GREEN}📋 Backups disponibles:${NC}"
ls -lht "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null

if [ ! "$(ls -A $BACKUP_DIR/backup_*.sql.gz 2>/dev/null)" ]; then
    echo -e "${RED}❌ No hay backups disponibles${NC}"
    exit 1
fi

echo ""
read -p "Ingrese el nombre del archivo de backup a restaurar (ej: backup_20251016_120000.sql.gz): " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}❌ El archivo de backup no existe${NC}"
    exit 1
fi

echo ""
read -p "¿Está seguro de que desea continuar? (escriba 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo -e "${YELLOW}❌ Operación cancelada${NC}"
    exit 0
fi

# Verificar que docker compose está disponible
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que el contenedor de postgres está corriendo
if ! docker compose ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ El contenedor de PostgreSQL no está corriendo${NC}"
    exit 1
fi

# Descomprimir backup si es necesario
TEMP_FILE="/tmp/restore_escalafin_$(date +%s).sql"
echo -e "${YELLOW}📦 Descomprimiendo backup...${NC}"
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$TEMP_FILE"

if [ ! -f "$TEMP_FILE" ]; then
    echo -e "${RED}❌ Error al descomprimir el backup${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup descomprimido${NC}"

# Crear backup de seguridad antes de restaurar
SAFETY_BACKUP="$BACKUP_DIR/safety_backup_before_restore_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${YELLOW}🔄 Creando backup de seguridad antes de restaurar...${NC}"
docker compose exec -T postgres pg_dump -U postgres escalafin_db > "$SAFETY_BACKUP"
gzip "$SAFETY_BACKUP"
echo -e "${GREEN}✅ Backup de seguridad creado: $(basename $SAFETY_BACKUP).gz${NC}"

# Detener la aplicación para evitar conflictos
echo -e "${YELLOW}⏸️ Deteniendo aplicación...${NC}"
docker compose stop app

# Restaurar el backup
echo -e "${YELLOW}🔄 Restaurando backup...${NC}"
docker compose exec -T postgres psql -U postgres -d escalafin_db < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup restaurado exitosamente${NC}"
    
    # Limpiar archivo temporal
    rm -f "$TEMP_FILE"
    
    # Reiniciar la aplicación
    echo -e "${YELLOW}🚀 Reiniciando aplicación...${NC}"
    docker compose start app
    
    echo -e "${GREEN}✅ Proceso de restauración completado${NC}"
else
    echo -e "${RED}❌ Error al restaurar el backup${NC}"
    
    # Restaurar el backup de seguridad
    echo -e "${YELLOW}🔄 Restaurando backup de seguridad...${NC}"
    gunzip -c "$SAFETY_BACKUP.gz" | docker compose exec -T postgres psql -U postgres -d escalafin_db
    
    # Reiniciar la aplicación
    docker compose start app
    
    echo -e "${RED}❌ Se restauró el backup de seguridad${NC}"
    exit 1
fi
