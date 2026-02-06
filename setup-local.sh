#!/bin/bash

# ================================
# Script de Setup Local
# ================================

echo "🚀 Iniciando setup local de EscalaFin..."

# 1. Copiar .env.local a app/.env
echo "📝 Copiando configuración local..."
cp .env.local app/.env

# 2. Levantar contenedores de base de datos
echo "🐳 Levantando PostgreSQL y Redis..."
docker-compose -f docker-compose.dev.yml up -d

# 3. Esperar que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

# 4. Instalar dependencias
echo "📦 Instalando dependencias..."
cd app
npm install

# 5. Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# 6. Sincronizar schema con la base de datos
echo "🗄️ Sincronizando schema..."
npx prisma db push

# 7. Ejecutar script de migración multi-tenancy
echo "🏢 Ejecutando migración multi-tenancy..."
npx ts-node scripts/migrate-to-multitenancy.ts

# 8. Ejecutar seed (opcional)
echo "🌱 Ejecutando seed..."
npx prisma db seed

echo "✅ Setup completado!"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  cd app && npm run dev"
echo ""
echo "La aplicación estará disponible en http://localhost:3000"
