# ================================
# Script de Setup Local (PowerShell)
# ================================

Write-Host "🚀 Iniciando setup local de EscalaFin..." -ForegroundColor Green

# 1. Copiar .env.local a app/.env
Write-Host "📝 Copiando configuración local..." -ForegroundColor Cyan
Copy-Item .env.local app/.env -Force

# 2. Levantar contenedores de base de datos
Write-Host "🐳 Levantando PostgreSQL y Redis..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up -d

# 3. Esperar que PostgreSQL esté listo
Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
Set-Location app
npm install

# 5. Generar Prisma Client
Write-Host "🔧 Generando Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# 6. Sincronizar schema con la base de datos
Write-Host "🗄️ Sincronizando schema..." -ForegroundColor Cyan
npx prisma db push

# 7. Ejecutar script de migración multi-tenancy
Write-Host "🏢 Ejecutando migración multi-tenancy..." -ForegroundColor Cyan
npx ts-node scripts/migrate-to-multitenancy.ts

# 8. Ejecutar seed (opcional)
Write-Host "🌱 Ejecutando seed..." -ForegroundColor Cyan
npx prisma db seed

Write-Host "`n✅ Setup completado!" -ForegroundColor Green
Write-Host "`nPara iniciar el servidor de desarrollo:" -ForegroundColor Yellow
Write-Host "  cd app" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nLa aplicación estará disponible en http://localhost:3000" -ForegroundColor Cyan

Set-Location ..
