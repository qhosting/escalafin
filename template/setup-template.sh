
#!/bin/bash

# 🚀 SETUP INICIAL DE PLANTILLA
# Configura un nuevo proyecto basado en esta plantilla

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   SETUP PLANTILLA - Nuevo Proyecto Next.js               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que estamos en el directorio template
if [ ! -f "setup-template.sh" ]; then
    echo -e "${RED}❌ Error: Este script debe ejecutarse desde el directorio template${NC}"
    exit 1
fi

# Solicitar información del proyecto
echo -e "${BLUE}📝 Configuración del Proyecto${NC}"
echo ""

read -p "Nombre del proyecto (ej: mi-proyecto): " PROJECT_NAME
read -p "Descripción breve: " PROJECT_DESC
read -p "Puerto (default 3000): " PORT
PORT=${PORT:-3000}

echo ""
echo -e "${BLUE}📦 Configuración de Base de Datos${NC}"
echo ""

read -p "Nombre de la base de datos: " DB_NAME
read -p "Usuario PostgreSQL (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}
read -sp "Contraseña PostgreSQL: " DB_PASS
echo ""
read -p "Host PostgreSQL (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}
read -p "Puerto PostgreSQL (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${BLUE}🔐 Generando Secrets...${NC}"

# Generar secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}✅ Secrets generados${NC}"

# Crear directorio del proyecto
echo ""
echo -e "${BLUE}📁 Creando estructura del proyecto...${NC}"

mkdir -p "../$PROJECT_NAME"
cd "../$PROJECT_NAME"

# Copiar archivos de template
echo -e "${BLUE}📋 Copiando archivos de plantilla...${NC}"

# Copiar estructura
cp -r ../template/* .
cp ../template/.dockerignore .
cp ../template/.gitignore .
cp ../template/.env.example .

echo -e "${GREEN}✅ Archivos copiados${NC}"

# Crear archivo .env
echo ""
echo -e "${BLUE}⚙️  Configurando variables de entorno...${NC}"

cat > .env << EOF
# Base de Datos
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# NextAuth & JWT
NEXTAUTH_URL="http://localhost:${PORT}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# Node Environment
NODE_ENV="development"

# App Config
APP_NAME="${PROJECT_NAME}"
APP_URL="http://localhost:${PORT}"
NEXT_PUBLIC_APP_NAME="${PROJECT_NAME}"
EOF

echo -e "${GREEN}✅ .env creado${NC}"

# Dar permisos de ejecución a scripts
echo ""
echo -e "${BLUE}🔧 Configurando permisos...${NC}"

chmod +x start-improved.sh
chmod +x emergency-start.sh
chmod +x healthcheck.sh
chmod +x backup-db.sh
chmod +x restore-db.sh
chmod +x scripts/*.sh

echo -e "${GREEN}✅ Permisos configurados${NC}"

# Crear directorios necesarios
echo ""
echo -e "${BLUE}📂 Creando directorios...${NC}"

mkdir -p app/prisma
mkdir -p logs
mkdir -p backups
mkdir -p uploads

echo -e "${GREEN}✅ Directorios creados${NC}"

# Inicializar Git
echo ""
echo -e "${BLUE}🔀 Inicializando Git...${NC}"

git init
git add .
git commit -m "Initial commit from template

Project: ${PROJECT_NAME}
Description: ${PROJECT_DESC}
Port: ${PORT}
Database: ${DB_NAME}"

echo -e "${GREEN}✅ Git inicializado${NC}"

# Resumen
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✅ SETUP COMPLETADO                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Proyecto creado en:${NC} $(pwd)"
echo ""
echo -e "${BLUE}📋 Próximos pasos:${NC}"
echo ""
echo "1. Instalar dependencias:"
echo -e "   ${YELLOW}cd app && yarn install${NC}"
echo ""
echo "2. Configurar Prisma schema:"
echo -e "   ${YELLOW}nano app/prisma/schema.prisma${NC}"
echo ""
echo "3. Crear y aplicar migraciones:"
echo -e "   ${YELLOW}cd app && yarn prisma migrate dev --name init${NC}"
echo ""
echo "4. Generar Prisma Client:"
echo -e "   ${YELLOW}cd app && yarn prisma generate${NC}"
echo ""
echo "5. Ejecutar validaciones:"
echo -e "   ${YELLOW}bash scripts/pre-build-check.sh${NC}"
echo ""
echo "6. Iniciar desarrollo:"
echo -e "   ${YELLOW}cd app && yarn dev${NC}"
echo ""
echo "7. O con Docker:"
echo -e "   ${YELLOW}docker-compose -f docker/docker-compose.yml up --build${NC}"
echo ""
echo -e "${BLUE}📄 Variables de entorno configuradas en:${NC} .env"
echo -e "${BLUE}📚 Documentación completa en:${NC} docs/"
echo ""
echo -e "${GREEN}¡Listo para comenzar a desarrollar! 🚀${NC}"
echo ""
