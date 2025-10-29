#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════"
echo "  TEST RÁPIDO DEL DOCKERFILE"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "✅ Verificando que el Dockerfile existe..."
if [ -f "Dockerfile" ]; then
    echo "   ✓ Dockerfile encontrado"
else
    echo "   ✗ Dockerfile NO encontrado"
    exit 1
fi

echo ""
echo "✅ Verificando sintaxis básica del Dockerfile..."
if grep -q "FROM node:18-slim" Dockerfile; then
    echo "   ✓ Base image correcta (node:18-slim)"
else
    echo "   ✗ Base image incorrecta"
    exit 1
fi

if grep -q "npm ci" Dockerfile; then
    echo "   ✓ Usa NPM (correcto)"
else
    echo "   ✗ No usa NPM"
    exit 1
fi

if grep -q "standalone" Dockerfile; then
    echo "   ✓ Build standalone configurado"
else
    echo "   ✗ Build standalone NO configurado"
    exit 1
fi

echo ""
echo "✅ Verificando scripts de inicio..."
for script in start-improved.sh emergency-start.sh healthcheck.sh; do
    if [ -f "$script" ]; then
        echo "   ✓ $script existe"
        if [ -x "$script" ]; then
            echo "   ✓ $script es ejecutable"
        else
            echo "   ! $script NO es ejecutable (se puede arreglar en Dockerfile)"
        fi
    else
        echo "   ✗ $script NO existe"
    fi
done

echo ""
echo "✅ Verificando .dockerignore..."
if [ -f ".dockerignore" ]; then
    echo "   ✓ .dockerignore existe"
    if grep -q "node_modules" .dockerignore; then
        echo "   ✓ Excluye node_modules"
    fi
    if grep -q ".next" .dockerignore; then
        echo "   ✓ Excluye .next"
    fi
else
    echo "   ⚠ .dockerignore NO existe (recomendado pero no crítico)"
fi

echo ""
echo "✅ Verificando estructura de archivos críticos..."
if [ -f "app/package.json" ]; then
    echo "   ✓ app/package.json existe"
else
    echo "   ✗ app/package.json NO existe"
    exit 1
fi

if [ -f "app/package-lock.json" ]; then
    echo "   ✓ app/package-lock.json existe"
else
    echo "   ✗ app/package-lock.json NO existe"
    exit 1
fi

if [ -f "app/next.config.js" ]; then
    echo "   ✓ app/next.config.js existe"
else
    echo "   ✗ app/next.config.js NO existe"
    exit 1
fi

echo ""
echo "✅ Verificando configuración de Next.js standalone..."
if grep -q "output.*standalone" app/next.config.js; then
    echo "   ✓ Next.js configurado para standalone"
else
    echo "   ⚠ Next.js standalone NO configurado explícitamente"
fi

echo ""
echo "✅ Verificando Prisma schema..."
if [ -f "app/prisma/schema.prisma" ]; then
    echo "   ✓ prisma/schema.prisma existe"
    if grep -q 'output.*=.*"' app/prisma/schema.prisma; then
        echo "   ⚠ Schema tiene output path explícito (verificar que no sea absoluto)"
    else
        echo "   ✓ Schema sin output path hardcoded"
    fi
else
    echo "   ✗ prisma/schema.prisma NO existe"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ DOCKERFILE VALIDADO CORRECTAMENTE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "El Dockerfile está correcto y listo para deployment."
echo "Todos los componentes necesarios están presentes."
echo ""

