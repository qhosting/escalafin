
#!/bin/bash
# Script para crear múltiples instancias de EscalaFin en Coolify

set -e

SERVER="adm.escalafin.com"
USER="root"
BASE_NAME="escalafin"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                🚀 EscalaFin Multi-Instance Deployment                        ║"
echo "║                        Powered by Coolify                                   ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Función para crear instancia
create_instance() {
    local instance_name=$1
    local domain=$2
    local port=$3
    
    log "Creando instancia: $instance_name"
    
    # Crear directorio de instancia
    local instance_dir="/tmp/escalafin-instances/$instance_name"
    mkdir -p "$instance_dir"
    
    # Copiar archivos base
    cp -r /home/ubuntu/escalafin_mvp/* "$instance_dir/"
    
    # Generar variables específicas para la instancia
    cat > "$instance_dir/.env.${instance_name}" << EOF
# Instancia: $instance_name
NODE_ENV=production
NEXTAUTH_URL=https://$domain
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Base de datos específica por instancia
DATABASE_URL=postgresql://escalafin_${instance_name}:$(openssl rand -base64 16 | tr -d '=+/')@db_${instance_name}:5432/escalafin_${instance_name}
POSTGRES_USER=escalafin_${instance_name}
POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d '=+/')
POSTGRES_DB=escalafin_${instance_name}

# Redis específico por instancia
REDIS_PASSWORD=$(openssl rand -base64 16 | tr -d '=+/')

# Puerto específico
PORT=$port

# Servicios externos (configurar después)
OPENPAY_MERCHANT_ID=
OPENPAY_PRIVATE_KEY=
OPENPAY_PUBLIC_KEY=
OPENPAY_BASE_URL=https://api.openpay.mx/v1

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=${instance_name}-files
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=$instance_name/

EVOLUTION_API_URL=
EVOLUTION_API_TOKEN=
EVOLUTION_INSTANCE_NAME=$instance_name
EOF

    # Crear docker-compose específico para la instancia
    cat > "$instance_dir/docker-compose.${instance_name}.yml" << EOF
version: '3.8'

services:
  app_${instance_name}:
    build:
      context: .
      dockerfile: Dockerfile.coolify
    container_name: escalafin_app_${instance_name}
    ports:
      - "${port}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://escalafin_${instance_name}:\${POSTGRES_PASSWORD}@db_${instance_name}:5432/escalafin_${instance_name}
      - NEXTAUTH_URL=https://$domain
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - AWS_BUCKET_NAME=${instance_name}-files
      - AWS_FOLDER_PREFIX=$instance_name/
      - EVOLUTION_INSTANCE_NAME=$instance_name
    depends_on:
      db_${instance_name}:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "coolify.managed=true"
      - "coolify.name=escalafin-${instance_name}"
      - "coolify.domain=${domain}"

  db_${instance_name}:
    image: postgres:14-alpine
    container_name: escalafin_db_${instance_name}
    environment:
      POSTGRES_USER: escalafin_${instance_name}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: escalafin_${instance_name}
    volumes:
      - postgres_data_${instance_name}:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U escalafin_${instance_name}"]
      interval: 10s
      timeout: 5s
      retries: 5
    labels:
      - "coolify.managed=true"

  redis_${instance_name}:
    image: redis:7-alpine
    container_name: escalafin_redis_${instance_name}
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data_${instance_name}:/data
    restart: unless-stopped
    labels:
      - "coolify.managed=true"

volumes:
  postgres_data_${instance_name}:
    labels:
      - "coolify.managed=true"
  redis_data_${instance_name}:
    labels:
      - "coolify.managed=true"
EOF

    success "Instancia $instance_name preparada en puerto $port"
    echo "   📁 Archivos: $instance_dir"
    echo "   🌐 Dominio: https://$domain"
    echo "   🔌 Puerto: $port"
    echo ""
}

# Función para desplegar via Coolify API
deploy_to_coolify() {
    local instance_name=$1
    local domain=$2
    local port=$3
    
    log "Desplegando $instance_name en Coolify..."
    
    # Copiar al servidor
    rsync -avz --progress "/tmp/escalafin-instances/$instance_name/" "$USER@$SERVER:/opt/coolify/instances/$instance_name/"
    
    # Ejecutar en el servidor
    ssh "$USER@$SERVER" << ENDSSH
cd /opt/coolify/instances/$instance_name

# Usar Coolify CLI si está disponible
if command -v coolify &> /dev/null; then
    echo "🎯 Usando Coolify CLI..."
    coolify service create $instance_name \\
        --compose-file docker-compose.${instance_name}.yml \\
        --env-file .env.${instance_name} \\
        --domain $domain
else
    echo "🐳 Desplegando directamente con Docker..."
    # Cargar variables de entorno
    export \$(cat .env.${instance_name} | xargs)
    
    # Desplegar
    docker-compose -f docker-compose.${instance_name}.yml up -d --build
    
    echo "✅ Instancia $instance_name desplegada en puerto $port"
fi
ENDSSH

    success "Instancia $instance_name desplegada correctamente"
}

# Menú principal
show_menu() {
    echo "¿Qué quieres hacer?"
    echo "1) Crear instancia individual"
    echo "2) Crear múltiples instancias automáticamente"
    echo "3) Listar instancias existentes"
    echo "4) Eliminar instancia"
    echo "5) Ver estado de instancias"
    echo "0) Salir"
    echo ""
}

# Crear instancia individual
create_single_instance() {
    echo ""
    read -p "Nombre de la instancia (ej: cliente1): " instance_name
    read -p "Dominio (ej: cliente1.escalafin.com): " domain
    read -p "Puerto (ej: 3001): " port
    
    create_instance "$instance_name" "$domain" "$port"
    
    read -p "¿Desplegar ahora? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_coolify "$instance_name" "$domain" "$port"
    else
        warning "Instancia creada pero no desplegada. Para desplegar después:"
        echo "rsync -avz /tmp/escalafin-instances/$instance_name/ root@adm.escalafin.com:/opt/coolify/instances/$instance_name/"
    fi
}

# Crear múltiples instancias
create_multiple_instances() {
    echo ""
    read -p "¿Cuántas instancias quieres crear? (ej: 3): " num_instances
    read -p "Prefijo para nombres (ej: cliente): " prefix
    read -p "Dominio base (ej: escalafin.com): " base_domain
    read -p "Puerto inicial (ej: 3001): " start_port
    
    for ((i=1; i<=num_instances; i++)); do
        instance_name="${prefix}${i}"
        domain="${instance_name}.${base_domain}"
        port=$((start_port + i - 1))
        
        create_instance "$instance_name" "$domain" "$port"
    done
    
    echo ""
    read -p "¿Desplegar todas las instancias ahora? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for ((i=1; i<=num_instances; i++)); do
            instance_name="${prefix}${i}"
            domain="${instance_name}.${base_domain}"
            port=$((start_port + i - 1))
            deploy_to_coolify "$instance_name" "$domain" "$port"
        done
    fi
}

# Listar instancias
list_instances() {
    log "Instancias locales preparadas:"
    if [ -d "/tmp/escalafin-instances" ]; then
        ls -la /tmp/escalafin-instances/ 2>/dev/null || echo "No hay instancias locales"
    fi
    
    echo ""
    log "Instancias en el servidor:"
    ssh "$USER@$SERVER" "ls -la /opt/coolify/instances/ 2>/dev/null || echo 'No hay instancias en el servidor'"
}

# Ver estado
check_status() {
    log "Verificando estado de instancias en el servidor..."
    ssh "$USER@$SERVER" << 'ENDSSH'
cd /opt/coolify/instances/
for instance in */; do
    if [ -d "$instance" ]; then
        echo "📊 Instancia: $instance"
        cd "$instance"
        if [ -f "docker-compose.*.yml" ]; then
            docker-compose -f docker-compose.*.yml ps 2>/dev/null || echo "  ❌ No está ejecutándose"
        fi
        cd ..
        echo ""
    fi
done
ENDSSH
}

# Programa principal
case "${1:-menu}" in
    "create")
        create_single_instance
        ;;
    "multi")
        create_multiple_instances
        ;;
    "list")
        list_instances
        ;;
    "status")
        check_status
        ;;
    "menu"|*)
        while true; do
            show_menu
            read -p "Selecciona una opción: " choice
            case $choice in
                1) create_single_instance ;;
                2) create_multiple_instances ;;
                3) list_instances ;;
                4) echo "Función de eliminación próximamente..." ;;
                5) check_status ;;
                0) echo "¡Hasta luego!"; exit 0 ;;
                *) warning "Opción no válida" ;;
            esac
            echo ""
            read -p "Presiona Enter para continuar..."
            clear
        done
        ;;
esac
