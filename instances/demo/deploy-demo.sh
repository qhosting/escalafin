
#!/bin/bash
# Script para desplegar la instancia DEMO en Coolify

set -e

SERVER="adm.escalafin.com"
USER="root"
INSTANCE_NAME="demo"
DOMAIN="demo.escalafin.com"
PORT="3001"

echo "🚀 Desplegando instancia DEMO de EscalaFin..."

# Copiar archivos al servidor
echo "📁 Copiando archivos de la instancia $INSTANCE_NAME al servidor..."
rsync -avz --progress --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  /tmp/escalafin-instances/demo/ ${USER}@${SERVER}:/opt/coolify/instances/demo/

# Ejecutar despliegue en el servidor
ssh ${USER}@${SERVER} << 'ENDSSH'
cd /opt/coolify/instances/demo

echo "🐳 Verificando Docker y Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Cargar variables de entorno
if [ -f .env.demo ]; then
    export $(cat .env.demo | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "❌ Archivo .env.demo no encontrado"
    exit 1
fi

# Detener instancia anterior si existe
echo "🛑 Deteniendo instancia anterior (si existe)..."
docker-compose -f docker-compose.demo.yml down 2>/dev/null || true

# Limpiar imágenes anteriores
docker-compose -f docker-compose.demo.yml down --rmi local 2>/dev/null || true

# Construir y levantar servicios
echo "🔨 Construyendo y desplegando instancia demo..."
docker-compose -f docker-compose.demo.yml up -d --build

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 45

# Verificar estado de los servicios
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.demo.yml ps

# Verificar salud de la aplicación
echo "🏥 Verificando salud de la aplicación..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Aplicación responde correctamente en puerto 3001"
        break
    else
        echo "⏳ Esperando respuesta de la aplicación... ($i/10)"
        sleep 5
    fi
done

# Mostrar logs de la aplicación (últimas 10 líneas)
echo "📝 Últimos logs de la aplicación:"
docker-compose -f docker-compose.demo.yml logs --tail=10 app_demo

echo ""
echo "🎉 ¡Instancia DEMO desplegada exitosamente!"
echo ""
echo "📱 URLs disponibles:"
echo "   - Aplicación: https://demo.escalafin.com"
echo "   - Health Check: https://demo.escalafin.com/api/health"
echo "   - Admin Panel: https://demo.escalafin.com/admin"
echo "   - Acceso directo: http://adm.escalafin.com:3001"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose -f docker-compose.demo.yml logs -f"
echo "   - Reiniciar: docker-compose -f docker-compose.demo.yml restart"
echo "   - Detener: docker-compose -f docker-compose.demo.yml down"
echo ""
echo "📋 Credenciales de prueba:"
echo "   - Admin: admin@escalafin.com / admin123"
echo "   - Asesor: asesor1@escalafin.com / asesor123"
echo ""
echo "⚙️ Configuración adicional requerida:"
echo "   - Configurar dominio demo.escalafin.com -> adm.escalafin.com"
echo "   - Configurar SSL con Coolify o Certbot"
echo "   - Configurar servicios externos (Openpay, WhatsApp, S3)"
echo ""

ENDSSH

echo "✅ Despliegue de instancia DEMO completado!"
