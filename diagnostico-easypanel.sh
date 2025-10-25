
#!/bin/bash

echo "🔍 DIAGNÓSTICO ESCALAFIN EN EASYPANEL"
echo "======================================"
echo ""

echo "📋 1. Verificando estructura de archivos..."
echo "---------------------------------------------"
if [ -f "/app/server.js" ]; then
    echo "✅ server.js encontrado en /app/"
else
    echo "❌ server.js NO ENCONTRADO en /app/"
    echo "🔍 Buscando server.js en el filesystem..."
    find /app -name "server.js" -type f 2>/dev/null || echo "No se encontró server.js"
fi

echo ""
echo "📂 2. Contenido del directorio /app/"
echo "---------------------------------------------"
ls -la /app/ | head -20

echo ""
echo "📦 3. Verificando archivos Next.js..."
echo "---------------------------------------------"
if [ -d "/app/.next" ]; then
    echo "✅ Directorio .next encontrado"
    ls -la /app/.next/ | head -10
else
    echo "❌ Directorio .next NO ENCONTRADO"
fi

echo ""
echo "🗄️ 4. Verificando Prisma..."
echo "---------------------------------------------"
if [ -d "/app/node_modules/.prisma" ]; then
    echo "✅ Prisma Client generado"
else
    echo "❌ Prisma Client NO generado"
fi

echo ""
echo "🌐 5. Verificando conectividad..."
echo "---------------------------------------------"
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL configurada"
else
    echo "❌ DATABASE_URL NO configurada"
fi

if [ -n "$NEXTAUTH_URL" ]; then
    echo "✅ NEXTAUTH_URL configurada: $NEXTAUTH_URL"
else
    echo "⚠️ NEXTAUTH_URL NO configurada"
fi

if [ -n "$NEXTAUTH_SECRET" ]; then
    echo "✅ NEXTAUTH_SECRET configurada"
else
    echo "⚠️ NEXTAUTH_SECRET NO configurada"
fi

echo ""
echo "🔌 6. Verificando puerto..."
echo "---------------------------------------------"
echo "Puerto configurado: ${PORT:-3000}"

echo ""
echo "🏥 7. Test de Health Check..."
echo "---------------------------------------------"
if command -v curl >/dev/null 2>&1; then
    curl -s http://localhost:${PORT:-3000}/api/health || echo "❌ Health check falló"
elif command -v wget >/dev/null 2>&1; then
    wget -qO- http://localhost:${PORT:-3000}/api/health || echo "❌ Health check falló"
else
    echo "⚠️ No se encontró curl ni wget para hacer el test"
fi

echo ""
echo "📊 8. Verificando procesos..."
echo "---------------------------------------------"
ps aux | grep node || echo "⚠️ No se encontró proceso node"

echo ""
echo "======================================"
echo "🎉 Diagnóstico completado"
echo "======================================"
