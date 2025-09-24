
#!/bin/bash
# Script rápido para configurar EscalaFin en Coolify

echo "🚀 Configuración rápida de EscalaFin para Coolify"
echo "================================================="

# Crear variables de entorno mínimas
cat > .env.production << EOF
NODE_ENV=production
NEXTAUTH_URL=https://escalafin.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://escalafin:$(openssl rand -base64 16)@db:5432/escalafin
POSTGRES_USER=escalafin
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=escalafin
REDIS_PASSWORD=$(openssl rand -base64 16)

# ⚠️ CONFIGURAR MANUALMENTE:
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

echo "✅ Variables de entorno creadas en .env.production"
echo ""
echo "📝 Próximos pasos:"
echo "1. Edita .env.production con tus credenciales reales"
echo "2. Sube el proyecto a GitHub"
echo "3. En Coolify (adm.escalafin.com):"
echo "   - Crear proyecto: escalafin-mvp"
echo "   - Conectar GitHub repo"
echo "   - Usar docker-compose.coolify.yml"
echo "   - Importar variables desde .env.production"
echo "4. ¡Desplegar!"
echo ""
echo "🔗 Guía completa: COOLIFY_DEPLOYMENT_GUIDE.md"
