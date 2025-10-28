
#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  TEST BUILD DOCKER - SIMULACIÓN LOCAL"
echo "════════════════════════════════════════════════════════════"
echo ""

cd /home/ubuntu/escalafin_mvp/app

echo "📋 1. Verificando configuración..."
echo "   ├─ next.config.js presente: $([ -f next.config.js ] && echo '✅' || echo '❌')"
echo "   ├─ package.json presente: $([ -f package.json ] && echo '✅' || echo '❌')"
echo "   └─ prisma/schema.prisma presente: $([ -f prisma/schema.prisma ] && echo '✅' || echo '❌')"
echo ""

echo "📦 2. Verificando Prisma schema..."
if grep -q "output.*=.*\"" prisma/schema.prisma; then
    echo "   ❌ ERROR: Schema tiene output hardcodeado"
    exit 1
else
    echo "   ✅ Schema correcto (sin output hardcodeado)"
fi
echo ""

echo "🔧 3. Generando Prisma Client..."
yarn prisma generate 2>&1 | tail -3
echo ""

echo "🏗️  4. Ejecutando build en modo standalone..."
echo "   Variable: NEXT_OUTPUT_MODE=standalone"
export NEXT_OUTPUT_MODE=standalone
yarn build 2>&1 | tail -20
echo ""

echo "📂 5. Verificando estructura generada..."
if [ -d ".next/standalone" ]; then
    echo "   ✅ Directorio .next/standalone creado"
    echo "   ├─ Tamaño: $(du -sh .next/standalone 2>/dev/null | cut -f1)"
    echo "   └─ server.js: $([ -f .next/standalone/app/server.js ] && echo '✅ Encontrado' || echo '❌ No encontrado')"
else
    echo "   ❌ ERROR: Directorio .next/standalone NO fue creado"
    echo "   ⚠️  Esto indica que el modo standalone no se activó correctamente"
fi
echo ""

echo "📁 6. Contenido de .next/:"
ls -lh .next/ | grep -E "^d" | awk '{print "   " $9 " (" $5 ")"}'
echo ""

if [ -f ".next/standalone/app/server.js" ]; then
    echo "════════════════════════════════════════════════════════════"
    echo "  ✅ BUILD EXITOSO - Listo para deploy"
    echo "════════════════════════════════════════════════════════════"
else
    echo "════════════════════════════════════════════════════════════"
    echo "  ❌ BUILD INCOMPLETO - Revisar configuración"
    echo "════════════════════════════════════════════════════════════"
fi
