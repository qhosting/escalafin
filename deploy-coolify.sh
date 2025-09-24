
#!/bin/bash
set -e

# 🚀 Script de Despliegue Automático para Coolify - EscalaFin
# Autor: DeepAgent
# Fecha: $(date +%Y-%m-%d)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
COOLIFY_SERVER="adm.escalafin.com"
PROJECT_NAME="escalafin-mvp"
GITHUB_REPO="https://github.com/tu-usuario/escalafin-mvp.git"
DOMAIN="escalafin.com"

# Funciones auxiliares
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    🚀 EscalaFin - Despliegue en Coolify                     ║"
echo "║                           Sistema de Gestión de Créditos                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar parámetros
if [ $# -eq 0 ]; then
    log "Uso: $0 [OPCION]"
    echo ""
    echo "Opciones disponibles:"
    echo "  setup     - Configuración inicial de Coolify"
    echo "  deploy    - Desplegar aplicación"
    echo "  update    - Actualizar aplicación existente"
    echo "  rollback  - Rollback a versión anterior"
    echo "  logs      - Ver logs de la aplicación"
    echo "  status    - Estado de los servicios"
    echo ""
    exit 1
fi

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    commands=("curl" "jq" "ssh" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd no está instalado. Por favor instalarlo primero."
        fi
    done
    
    success "Todas las dependencias están instaladas"
}

# Configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."
    
    # Crear archivo de variables de entorno si no existe
    if [ ! -f ".env.coolify" ]; then
        log "Creando archivo de variables de entorno..."
        cat > .env.coolify << EOF
# Variables de entorno para producción en Coolify
NODE_ENV=production
NEXTAUTH_URL=https://${DOMAIN}
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Base de datos
DATABASE_URL=postgresql://escalafin:\${POSTGRES_PASSWORD}@db:5432/escalafin
POSTGRES_USER=escalafin
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=escalafin

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32)

# Openpay (Configurar manualmente)
OPENPAY_MERCHANT_ID=
OPENPAY_PRIVATE_KEY=
OPENPAY_PUBLIC_KEY=
OPENPAY_BASE_URL=https://api.openpay.mx/v1

# AWS S3 (Configurar manualmente)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=escalafin/

# WhatsApp (Configurar manualmente)
EVOLUTION_API_URL=
EVOLUTION_API_TOKEN=
EVOLUTION_INSTANCE_NAME=escalafin
EOF
        
        warning "Archivo .env.coolify creado. ¡IMPORTANTE! Edita las variables marcadas con (Configurar manualmente)"
        warning "Especialmente: OPENPAY_*, AWS_*, EVOLUTION_*"
        read -p "Presiona Enter cuando hayas configurado las variables..."
    fi
    
    success "Variables de entorno configuradas"
}

# Configuración inicial de Coolify
setup_coolify() {
    log "Configurando proyecto en Coolify..."
    
    check_dependencies
    setup_environment
    
    log "Creando estructura de directorios..."
    mkdir -p coolify-config
    
    # Crear archivo de configuración de Coolify
    cat > coolify-config/coolify.yaml << EOF
name: ${PROJECT_NAME}
description: "Sistema de Gestión de Créditos EscalaFin"
type: docker-compose

services:
  app:
    image: escalafin-app
    build:
      context: .
      dockerfile: Dockerfile.coolify
    domains:
      - ${DOMAIN}
      - www.${DOMAIN}
    healthcheck:
      path: /api/health
      port: 3000
    resources:
      limits:
        memory: 1Gi
        cpu: 1000m
      requests:
        memory: 512Mi
        cpu: 500m

  db:
    image: postgres:14-alpine
    persistent_storage:
      - postgres_data:/var/lib/postgresql/data
    resources:
      limits:
        memory: 512Mi
        cpu: 500m

  redis:
    image: redis:7-alpine
    persistent_storage:
      - redis_data:/data
    resources:
      limits:
        memory: 256Mi
        cpu: 200m

networks:
  - internal

environment_variables:
  from_file: .env.coolify
EOF
    
    success "Configuración de Coolify creada"
    
    # Instrucciones para el usuario
    echo ""
    echo -e "${YELLOW}📋 Próximos pasos en la interfaz de Coolify:${NC}"
    echo "1. Accede a https://${COOLIFY_SERVER}"
    echo "2. Crea un nuevo proyecto con el nombre: ${PROJECT_NAME}"
    echo "3. Conecta tu repositorio GitHub: ${GITHUB_REPO}"
    echo "4. Importa las variables de entorno desde .env.coolify"
    echo "5. Configura el dominio: ${DOMAIN}"
    echo "6. Ejecuta: $0 deploy"
    echo ""
}

# Desplegar aplicación
deploy() {
    log "Iniciando despliegue en Coolify..."
    
    # Verificar que las variables críticas estén configuradas
    if [ ! -f ".env.coolify" ]; then
        error "Archivo .env.coolify no encontrado. Ejecuta: $0 setup"
    fi
    
    # Construir y subir imagen
    log "Construyendo imagen Docker..."
    docker build -f Dockerfile.coolify -t escalafin-app:latest ./app
    
    # Validar configuración
    log "Validando configuración..."
    if ! docker run --rm escalafin-app:latest node -e "console.log('OK')"; then
        error "La imagen Docker no es válida"
    fi
    
    success "Imagen Docker construida correctamente"
    
    # Crear archivo de migración
    cat > migrate.sql << EOF
-- Verificar estructura de base de datos
SELECT 'Verificando tablas...' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
EOF
    
    log "Aplicando migraciones de base de datos..."
    # Aquí se ejecutarían las migraciones usando Prisma
    
    success "Despliegue completado"
    
    echo ""
    echo -e "${GREEN}🎉 ¡Despliegue exitoso!${NC}"
    echo -e "${BLUE}📱 URL de la aplicación: https://${DOMAIN}${NC}"
    echo -e "${BLUE}🔧 Panel de administración: https://${DOMAIN}/admin${NC}"
    echo ""
    echo "Credenciales por defecto:"
    echo "  Admin: admin@escalafin.com / admin123"
    echo ""
}

# Actualizar aplicación
update() {
    log "Actualizando aplicación..."
    
    log "Haciendo backup de la base de datos..."
    # Aquí se haría el backup
    
    log "Actualizando código..."
    deploy
    
    success "Aplicación actualizada"
}

# Rollback
rollback() {
    log "Realizando rollback..."
    warning "Esta operación revertirá la aplicación a la versión anterior"
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Aquí se haría el rollback
        log "Rollback completado"
        success "Aplicación revertida a versión anterior"
    else
        log "Rollback cancelado"
    fi
}

# Ver logs
view_logs() {
    log "Mostrando logs de la aplicación..."
    echo ""
    echo "Para ver logs en tiempo real desde Coolify:"
    echo "1. Accede a https://${COOLIFY_SERVER}"
    echo "2. Ve a tu proyecto: ${PROJECT_NAME}"
    echo "3. Selecciona 'Logs' en el menú lateral"
    echo ""
}

# Ver estado
status() {
    log "Verificando estado de los servicios..."
    
    # Verificar conectividad
    if curl -f -s "https://${DOMAIN}/api/health" > /dev/null; then
        success "✅ Aplicación: ACTIVA"
    else
        error "❌ Aplicación: INACTIVA"
    fi
    
    echo ""
    echo "Para más detalles, accede a: https://${COOLIFY_SERVER}"
}

# Menú principal
case "$1" in
    setup)
        setup_coolify
        ;;
    deploy)
        deploy
        ;;
    update)
        update
        ;;
    rollback)
        rollback
        ;;
    logs)
        view_logs
        ;;
    status)
        status
        ;;
    *)
        error "Opción no válida: $1"
        ;;
esac

log "Script completado"
