
#!/bin/bash
# Script para desplegar EscalaFin directamente en el servidor via SSH

set -e

SERVER="adm.escalafin.com"
USER="root"
PROJECT_PATH="/opt/escalafin"
LOCAL_PATH="/home/ubuntu/escalafin_mvp"

echo "🚀 Desplegando EscalaFin en ${SERVER}..."

# Crear directorio en el servidor
ssh ${USER}@${SERVER} "mkdir -p ${PROJECT_PATH}"

# Copiar archivos al servidor
echo "📁 Copiando archivos al servidor..."
rsync -avz --progress ${LOCAL_PATH}/ ${USER}@${SERVER}:${PROJECT_PATH}/

# Ejecutar despliegue en el servidor
ssh ${USER}@${SERVER} << 'ENDSSH'
cd /opt/escalafin

# Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Configurar variables de entorno para producción
echo "⚙️ Configurando variables de entorno..."
cat > .env << 'EOF'
NODE_ENV=production
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=7Vl9Ey7W7etMb2vlFqd6uLDSC+eQPLO3hhnep522cVY=
DATABASE_URL=postgresql://escalafin:KLzxZk4aPpucI4OZwQMOCg==@db:5432/escalafin
POSTGRES_USER=escalafin
POSTGRES_PASSWORD=KLzxZk4aPpucI4OZwQMOCg==
POSTGRES_DB=escalafin
REDIS_PASSWORD=O0gQyNnTqCWYR0mJodnhMg==

# Servicios externos (vacío por ahora)
OPENPAY_MERCHANT_ID=
OPENPAY_PRIVATE_KEY=
OPENPAY_PUBLIC_KEY=
OPENPAY_BASE_URL=https://api.openpay.mx/v1

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_REGION=us-east-1
AWS_FOLDER_PREFIX=escalafin/

EVOLUTION_API_URL=
EVOLUTION_API_TOKEN=
EVOLUTION_INSTANCE_NAME=escalafin
EOF

# Detener servicios anteriores si existen
docker-compose -f docker-compose.coolify.yml down 2>/dev/null || true

# Limpiar volúmenes si es necesario
# docker volume prune -f

# Construir y levantar servicios
echo "🚀 Desplegando aplicación..."
docker-compose -f docker-compose.coolify.yml up -d --build

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado
docker-compose -f docker-compose.coolify.yml ps

# Configurar nginx reverse proxy si no existe
if [ ! -f /etc/nginx/sites-available/escalafin ]; then
    echo "🌐 Configurando Nginx..."
    
    # Instalar nginx si no está
    apt update && apt install -y nginx
    
    # Crear configuración
    cat > /etc/nginx/sites-available/escalafin << 'NGINX_EOF'
server {
    listen 80;
    server_name escalafin.com www.escalafin.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name escalafin.com www.escalafin.com;
    
    # SSL Configuration (usar certbot después)
    # ssl_certificate /etc/letsencrypt/live/escalafin.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/escalafin.com/privkey.pem;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF
    
    # Habilitar sitio
    ln -sf /etc/nginx/sites-available/escalafin /etc/nginx/sites-enabled/
    
    # Remover sitio por defecto
    rm -f /etc/nginx/sites-enabled/default
    
    # Test y reload nginx
    nginx -t && systemctl reload nginx
    
    echo "✅ Nginx configurado. Para SSL, ejecuta: certbot --nginx -d escalafin.com -d www.escalafin.com"
fi

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📱 URLs disponibles:"
echo "   - Local: http://localhost:3000"
echo "   - Producción: http://escalafin.com (configurar SSL después)"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose -f docker-compose.coolify.yml logs -f"
echo "   - Reiniciar: docker-compose -f docker-compose.coolify.yml restart"
echo "   - Detener: docker-compose -f docker-compose.coolify.yml down"
echo ""

ENDSSH

echo "✅ Despliegue completado desde SSH!"
