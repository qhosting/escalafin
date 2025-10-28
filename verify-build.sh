
#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "🔍 VERIFICACIÓN DE BUILD - ESCALAFIN"
echo "═══════════════════════════════════════════════════════════════════"

# Verificar directorio actual
echo "📂 Directorio actual: $(pwd)"
echo ""

# Verificar archivos esenciales
echo "🔍 Verificando archivos esenciales..."
for file in package.json next.config.js prisma/schema.prisma; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file NO ENCONTRADO"
        exit 1
    fi
done
echo ""

# Verificar node_modules
echo "🔍 Verificando node_modules..."
if [ -d "node_modules" ]; then
    PKG_COUNT=$(ls node_modules | wc -l)
    echo "  ✅ node_modules ($PKG_COUNT paquetes)"
else
    echo "  ❌ node_modules NO ENCONTRADO"
    exit 1
fi
echo ""

# Verificar Prisma Client
echo "🔍 Verificando Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "  ✅ Prisma Client generado"
else
    echo "  ❌ Prisma Client NO generado"
    exit 1
fi
echo ""

# Verificar build de Next.js
echo "🔍 Verificando build de Next.js..."
if [ -d ".next" ]; then
    echo "  ✅ Directorio .next existe"
    
    if [ -d ".next/standalone" ]; then
        echo "  ✅ Build standalone generado"
        
        if [ -f ".next/standalone/app/server.js" ]; then
            echo "  ✅ server.js encontrado en standalone/app/"
        else
            echo "  ❌ server.js NO encontrado en standalone/app/"
            echo "  🔍 Buscando server.js..."
            find .next -name "server.js" -type f | head -5
            exit 1
        fi
        
        echo "  📋 Archivos en standalone:"
        ls -lah .next/standalone/ | head -10
    else
        echo "  ❌ Build standalone NO generado"
        exit 1
    fi
else
    echo "  ❌ Directorio .next NO existe"
    exit 1
fi
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "✅ VERIFICACIÓN COMPLETADA - TODO OK"
echo "═══════════════════════════════════════════════════════════════════"
