
#!/bin/bash

# 🧪 TEST DE BUILD LOCAL PARA IDENTIFICAR ERRORES
# ================================================

set -e

echo "🔍 =================================="
echo "🔍 TEST DE BUILD LOCAL"
echo "🔍 =================================="
echo ""

cd /home/ubuntu/escalafin_mvp/app

# Verificar estructura
echo "📂 1. Verificando estructura..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules no existe. Instalando..."
    yarn install
else
    echo "✅ node_modules existe"
fi

# Verificar Prisma
echo ""
echo "🔧 2. Generando Prisma Client..."
npx prisma generate

# Configurar variables para el build
echo ""
echo "⚙️  3. Configurando variables de entorno..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export SKIP_ENV_VALIDATION=1
export NEXT_OUTPUT_MODE=standalone

echo "Variables configuradas:"
echo "  NODE_ENV=$NODE_ENV"
echo "  SKIP_ENV_VALIDATION=$SKIP_ENV_VALIDATION"
echo "  NEXT_OUTPUT_MODE=$NEXT_OUTPUT_MODE"

# Intentar build
echo ""
echo "🏗️  4. Intentando build con Next.js..."
echo "---"

if yarn build 2>&1 | tee /tmp/build-test.log; then
    echo "---"
    echo "✅ BUILD EXITOSO!"
    echo ""
    echo "📊 Verificando salida..."
    if [ -d ".next/standalone" ]; then
        echo "✅ Standalone generado correctamente"
        ls -lh .next/standalone/
    else
        echo "⚠️  Standalone NO generado (verifica next.config.js)"
    fi
else
    echo "---"
    echo "❌ BUILD FALLÓ"
    echo ""
    echo "📋 Últimas 50 líneas del error:"
    echo "================================"
    tail -50 /tmp/build-test.log
    echo "================================"
    echo ""
    echo "💡 Analiza el error arriba para identificar el problema"
    exit 1
fi

echo ""
echo "✅ Test completado exitosamente"
echo "🚀 El proyecto está listo para deploy en EasyPanel"
