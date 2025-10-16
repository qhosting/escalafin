
#!/bin/bash

# Script de backup automático para PostgreSQL de EscalaFin
# Autor: DeepAgent
# Fecha: 16 de octubre de 2025

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="/backup-escalafin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo -e "${GREEN}🔄 Iniciando backup de base de datos EscalaFin...${NC}"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

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

# Crear backup
echo -e "${YELLOW}📦 Creando backup...${NC}"
docker compose exec -T postgres pg_dump -U postgres escalafin_db > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Verificar que el backup se creó correctamente
if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.sql" ]; then
    SIZE=$(du -h "$BACKUP_DIR/backup_$TIMESTAMP.sql" | cut -f1)
    echo -e "${GREEN}✅ Backup creado exitosamente: backup_$TIMESTAMP.sql ($SIZE)${NC}"
    
    # Comprimir el backup
    echo -e "${YELLOW}📦 Comprimiendo backup...${NC}"
    gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"
    COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz" | cut -f1)
    echo -e "${GREEN}✅ Backup comprimido: backup_$TIMESTAMP.sql.gz ($COMPRESSED_SIZE)${NC}"
else
    echo -e "${RED}❌ Error al crear el backup${NC}"
    exit 1
fi

# Limpiar backups antiguos (más de RETENTION_DAYS días)
echo -e "${YELLOW}🗑️ Limpiando backups antiguos (> $RETENTION_DAYS días)...${NC}"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Backups restantes: $REMAINING${NC}"

# Listar backups disponibles
echo -e "${GREEN}📋 Backups disponibles:${NC}"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "No hay backups disponibles"

echo -e "${GREEN}✅ Proceso de backup completado${NC}"
