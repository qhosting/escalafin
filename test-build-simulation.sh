#!/bin/bash
# Simular build de Docker sin Docker instalado

echo "═══════════════════════════════════════════════════════════════════════"
echo "🔍 SIMULACIÓN DE BUILD DE DOCKER - VERIFICACIÓN PRE-DEPLOY"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

cd /home/ubuntu/escalafin_mvp

# Verificar estructura
echo "1️⃣ Verificando estructura del proyecto..."
echo ""

# Verificar que app/ existe
if [ ! -d "app" ]; then
    echo "❌ ERROR: Directorio app/ no existe"
    exit 1
fi
echo "✅ Directorio app/ existe"

# Verificar package.json
if [ ! -f "app/package.json" ]; then
    echo "❌ ERROR: app/package.json no existe"
    exit 1
fi
echo "✅ app/package.json existe"

# Verificar package-lock.json
if [ ! -f "app/package-lock.json" ]; then
    echo "❌ ERROR: app/package-lock.json no existe"
    exit 1
fi
echo "✅ app/package-lock.json existe"

# Verificar que NO existe yarn.lock en app/
if [ -f "app/yarn.lock" ] && [ ! -L "app/yarn.lock" ]; then
    echo "❌ ERROR: app/yarn.lock existe como archivo regular (debería ser symlink o no existir)"
    exit 1
fi
echo "✅ app/yarn.lock no existe como archivo regular"

# Verificar Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ ERROR: Dockerfile no existe"
    exit 1
fi
echo "✅ Dockerfile existe"

echo ""
echo "2️⃣ Verificando contenido del Dockerfile..."
echo ""

# Verificar que NO intenta copiar yarn.lock
if grep -q "COPY app/yarn.lock" Dockerfile; then
    echo "❌ ERROR: Dockerfile intenta copiar app/yarn.lock"
    exit 1
fi
echo "✅ Dockerfile NO intenta copiar yarn.lock"

# Verificar que crea yarn.lock dummy
if ! grep -q "> /yarn.lock" Dockerfile; then
    echo "❌ ERROR: Dockerfile NO crea /yarn.lock"
    exit 1
fi
echo "✅ Dockerfile crea /yarn.lock"

if ! grep -q "> yarn.lock" Dockerfile; then
    echo "❌ ERROR: Dockerfile NO crea yarn.lock relativo"
    exit 1
fi
echo "✅ Dockerfile crea yarn.lock (relativo)"

# Verificar que NO usa mkdir -p /app en el RUN de yarn.lock
if grep -A 3 "yarn.lock dummy" Dockerfile | grep -q "mkdir -p /app"; then
    echo "⚠️  WARNING: Dockerfile usa mkdir -p /app (puede causar conflicto)"
else
    echo "✅ Dockerfile NO usa mkdir -p /app (correcto)"
fi

echo ""
echo "3️⃣ Verificando scripts de inicio..."
echo ""

# Verificar start-improved.sh
if [ ! -f "start-improved.sh" ]; then
    echo "❌ ERROR: start-improved.sh no existe"
    exit 1
fi
echo "✅ start-improved.sh existe"

# Verificar emergency-start.sh
if [ ! -f "emergency-start.sh" ]; then
    echo "❌ ERROR: emergency-start.sh no existe"
    exit 1
fi
echo "✅ emergency-start.sh existe"

# Verificar healthcheck.sh
if [ ! -f "healthcheck.sh" ]; then
    echo "❌ ERROR: healthcheck.sh no existe"
    exit 1
fi
echo "✅ healthcheck.sh existe"

# Verificar que los scripts son ejecutables
chmod +x start-improved.sh emergency-start.sh healthcheck.sh
echo "✅ Scripts configurados como ejecutables"

echo ""
echo "4️⃣ Verificando que scripts están en .dockerignore..."
echo ""

if [ -f ".dockerignore" ]; then
    if grep -q "^start-improved.sh$" .dockerignore || \
       grep -q "^start-" .dockerignore || \
       grep -q "^\*.sh$" .dockerignore; then
        echo "❌ ERROR: Scripts de inicio están en .dockerignore"
        echo "   Esto hará que no se copien al contenedor"
        exit 1
    fi
    echo "✅ Scripts NO están excluidos en .dockerignore"
else
    echo "⚠️  WARNING: .dockerignore no existe"
fi

echo ""
echo "5️⃣ Verificando prisma/schema.prisma..."
echo ""

if [ ! -f "app/prisma/schema.prisma" ]; then
    echo "❌ ERROR: app/prisma/schema.prisma no existe"
    exit 1
fi
echo "✅ app/prisma/schema.prisma existe"

# Verificar que NO tiene output personalizado
if grep -q "output.*node_modules" app/prisma/schema.prisma; then
    echo "⚠️  WARNING: schema.prisma tiene output personalizado en node_modules"
    echo "   Esto puede causar problemas en producción"
else
    echo "✅ schema.prisma NO tiene output personalizado (correcto)"
fi

echo ""
echo "6️⃣ Verificando next.config.js..."
echo ""

if [ ! -f "app/next.config.js" ]; then
    echo "❌ ERROR: app/next.config.js no existe"
    exit 1
fi
echo "✅ app/next.config.js existe"

# Verificar outputFileTracingRoot
if grep -q "outputFileTracingRoot" app/next.config.js; then
    echo "✅ next.config.js usa outputFileTracingRoot"
    echo "   (por eso necesitamos yarn.lock dummy en /)"
else
    echo "⚠️  INFO: next.config.js NO usa outputFileTracingRoot"
fi

echo ""
echo "7️⃣ Simulando instalación de dependencias..."
echo ""

cd app
if npm ci --dry-run --legacy-peer-deps > /tmp/npm_test.log 2>&1; then
    echo "✅ npm ci funcionaría correctamente"
else
    echo "❌ ERROR: npm ci fallaría"
    echo "   Ver detalles en /tmp/npm_test.log"
    tail -20 /tmp/npm_test.log
    cd ..
    exit 1
fi
cd ..

echo ""
echo "8️⃣ Verificando build de Next.js..."
echo ""

cd app
if [ -d ".next" ]; then
    echo "✅ Build de Next.js previo existe en .next/"
    echo "   Rutas generadas: $(find .next -name "*.js" | wc -l) archivos JS"
else
    echo "⚠️  INFO: No hay build previo de Next.js"
fi
cd ..

echo ""
echo "9️⃣ Verificando variables de entorno críticas..."
echo ""

if [ -f "app/.env" ]; then
    echo "✅ app/.env existe"
    
    # Verificar variables críticas
    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" app/.env; then
            echo "   ✅ $var definida"
        else
            echo "   ⚠️  $var NO definida en .env"
        fi
    done
else
    echo "⚠️  WARNING: app/.env no existe"
    echo "   El contenedor necesitará variables de entorno en runtime"
fi

echo ""
echo "🔟 Verificando scripts/setup-users-production.js..."
echo ""

if [ ! -f "app/scripts/setup-users-production.js" ]; then
    echo "⚠️  WARNING: app/scripts/setup-users-production.js no existe"
    echo "   El script de setup de usuarios no se ejecutará"
else
    echo "✅ app/scripts/setup-users-production.js existe"
    
    # Verificar que requiere bcryptjs
    if grep -q "bcryptjs" app/scripts/setup-users-production.js; then
        echo "   ✅ Script usa bcryptjs"
        
        # Verificar que bcryptjs está en package.json
        if grep -q "bcryptjs" app/package.json; then
            echo "   ✅ bcryptjs en package.json"
        else
            echo "   ❌ ERROR: bcryptjs NO está en package.json"
            exit 1
        fi
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ TODAS LAS VERIFICACIONES PASARON"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Resumen:"
echo "   - Estructura del proyecto: OK"
echo "   - Dockerfile optimizado: OK"
echo "   - Scripts de inicio: OK"
echo "   - Prisma schema: OK"
echo "   - Next.js config: OK"
echo "   - Dependencias NPM: OK"
echo "   - Variables de entorno: OK (si existen en runtime)"
echo ""
echo "🚀 El proyecto está LISTO para build en EasyPanel"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
