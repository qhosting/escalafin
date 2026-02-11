#!/bin/bash
set -e

echo "🚀 Iniciando ESCALAFIN (versión mejorada)..."
echo ""

# Configurar PATH
export PATH="$PATH:/app/node_modules/.bin"
echo "📍 PATH: $PATH"
echo ""

# Detectar comando Prisma disponible
echo "🔍 Detectando Prisma CLI..."
if [ -x "node_modules/.bin/prisma" ]; then
    PRISMA_CMD="node_modules/.bin/prisma"
    echo "  ✅ Usando: node_modules/.bin/prisma"
elif [ -f "package-lock.json" ] && command -v npm >/dev/null 2>&1; then
    PRISMA_CMD="npx prisma"
    echo "  ✅ Usando: npx prisma (NPM project detected)"
elif [ -f "yarn.lock" ] && command -v yarn >/dev/null 2>&1; then
    PRISMA_CMD="yarn prisma"
    echo "  ✅ Usando: yarn prisma (Yarn project detected)"
else
    PRISMA_CMD="npx prisma"
    echo "  ⚠️  Fallback: npx prisma"
fi
echo ""

# Verificar conexión a base de datos
echo "🔌 Verificando conexión a base de datos..."
if [ -n "$DATABASE_URL" ]; then
    echo "  ✅ DATABASE_URL configurada"
    
    # Sincronizar esquema con base de datos
    echo "🔄 Sincronizando esquema con base de datos..."
    echo "  📍 Usando comando: $PRISMA_CMD"
    echo "  📍 Working directory: $(pwd)"
    echo "  📍 Schema location: $(pwd)/prisma/schema.prisma"
    
    # Verificar que el schema existe
    if [ ! -f "prisma/schema.prisma" ]; then
        echo "  ❌ ERROR: prisma/schema.prisma no encontrado"
        exit 1
    fi
    
    # Ejecutar db push con captura completa de output
    echo "  🚀 Ejecutando: $PRISMA_CMD db push --accept-data-loss --skip-generate"
    DB_PUSH_OUTPUT=$($PRISMA_CMD db push --accept-data-loss --skip-generate 2>&1)
    DB_PUSH_EXIT_CODE=$?
    
    echo "  📋 Output completo del comando:"
    echo "$DB_PUSH_OUTPUT"
    
    if [ $DB_PUSH_EXIT_CODE -eq 0 ]; then
        echo "  ✅ Esquema sincronizado exitosamente"
    else
        echo "  ❌ ERROR: db push falló con código: $DB_PUSH_EXIT_CODE"
        echo "  💡 Verifica que DATABASE_URL sea correcta y la base de datos esté accesible"
        exit 1
    fi
    
    # Sincronizar módulos PWA (automático en cada deploy)
    echo ""
    echo "🔄 Sincronizando módulos PWA..."
    
    # Preferir versión JavaScript (producción) sobre TypeScript (desarrollo)
    if [ -f "scripts/seed-modules.js" ]; then
        echo "  📂 Script encontrado: scripts/seed-modules.js (producción)"
        echo "  🚀 Ejecutando seed de módulos..."
        
        # Configurar NODE_PATH para que encuentre @prisma/client
        export NODE_PATH=/app/node_modules:$NODE_PATH
        
        # Ejecutar con captura de output
        node scripts/seed-modules.js 2>&1 | while IFS= read -r line; do
            echo "  $line"
        done
        MODULE_SEED_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $MODULE_SEED_EXIT_CODE -eq 0 ]; then
            echo "  ✅ Módulos PWA sincronizados exitosamente"
        else
            echo "  ⚠️  Error sincronizando módulos (código: $MODULE_SEED_EXIT_CODE)"
            echo "  💡 El sistema continuará, pero algunos módulos pueden no estar disponibles"
        fi
    elif [ -f "scripts/seed-modules.ts" ]; then
        echo "  📂 Script encontrado: scripts/seed-modules.ts (desarrollo)"
        echo "  🚀 Ejecutando seed de módulos..."
        
        # Usar tsx directamente con NODE_PATH (evita problemas de workspace de Yarn)
        if [ -x "node_modules/.bin/tsx" ]; then
            TSX_CMD="node_modules/.bin/tsx"
        elif command -v tsx >/dev/null 2>&1; then
            TSX_CMD="tsx"
        else
            echo "  ⚠️  tsx/ts-node no disponibles en producción"
            echo "  💡 Use la versión JavaScript (seed-modules.js) para producción"
            MODULE_SEED_EXIT_CODE=1
        fi
        
        if [ -n "$TSX_CMD" ]; then
            # Configurar NODE_PATH para que encuentre @prisma/client
            export NODE_PATH=/app/node_modules:$NODE_PATH
            
            # Ejecutar con captura de output
            $TSX_CMD scripts/seed-modules.ts 2>&1 | while IFS= read -r line; do
                echo "  $line"
            done
            MODULE_SEED_EXIT_CODE=${PIPESTATUS[0]}
            
            if [ $MODULE_SEED_EXIT_CODE -eq 0 ]; then
                echo "  ✅ Módulos PWA sincronizados exitosamente"
            else
                echo "  ⚠️  Error sincronizando módulos (código: $MODULE_SEED_EXIT_CODE)"
                echo "  💡 El sistema continuará, pero algunos módulos pueden no estar disponibles"
            fi
        fi
    else
        echo "  ⚠️  scripts/seed-modules.js/ts no encontrado"
        echo "  💡 Los módulos PWA no se sincronizarán automáticamente"
    fi
    
    # Ejecutar seeding de plantillas de mensajes
    echo ""
    echo "📝 Sincronizando plantillas de mensajes..."
    if [ -f "scripts/seed-message-templates.js" ]; then
        echo "  📂 Script encontrado: scripts/seed-message-templates.js"
        echo "  🚀 Ejecutando seed de plantillas..."
        
        # Configurar NODE_PATH para que encuentre @prisma/client
        export NODE_PATH=/app/node_modules:$NODE_PATH
        
        # Ejecutar con captura de output
        node scripts/seed-message-templates.js 2>&1 | while IFS= read -r line; do
            echo "  $line"
        done
        TEMPLATES_SEED_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $TEMPLATES_SEED_EXIT_CODE -eq 0 ]; then
            echo "  ✅ Plantillas de mensajes sincronizadas exitosamente"
        else
            echo "  ⚠️  Error sincronizando plantillas (código: $TEMPLATES_SEED_EXIT_CODE)"
            echo "  💡 El sistema continuará, pero las plantillas pueden no estar disponibles"
        fi
    else
        echo "  ⚠️  scripts/seed-message-templates.js no encontrado"
        echo "  💡 Las plantillas de mensajes no se sincronizarán automáticamente"
    fi

    # Ejecutar setup de usuarios si es necesario
    echo ""
    echo "🌱 Verificando necesidad de configurar usuarios..."
    USER_COUNT=$(node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count()
            .then(count => { console.log(count); process.exit(0); })
            .catch(err => { console.error('0'); process.exit(0); })
            .finally(() => prisma.\$disconnect());
    " 2>/dev/null || echo "0")
    
    echo "  👥 Usuarios en DB: $USER_COUNT"
    
    if [ "$USER_COUNT" = "0" ]; then
        echo "  🌱 Configurando usuarios de prueba..."
        echo "  📂 Directorio actual: $(pwd)"
        echo "  📂 Verificando existencia de archivos..."
        ls -la scripts/ 2>/dev/null || echo "  ⚠️  Directorio scripts/ no encontrado"
        
        # Intentar con ruta relativa primero
        if [ -f "scripts/setup-users-production.js" ]; then
            echo "  ✅ Script encontrado (ruta relativa)"
            SCRIPT_PATH="scripts/setup-users-production.js"
        # Intentar con ruta absoluta
        elif [ -f "/app/scripts/setup-users-production.js" ]; then
            echo "  ✅ Script encontrado (ruta absoluta)"
            SCRIPT_PATH="/app/scripts/setup-users-production.js"
        else
            echo "  ⚠️  setup-users-production.js no encontrado en:"
            echo "       - $(pwd)/scripts/setup-users-production.js"
            echo "       - /app/scripts/setup-users-production.js"
            echo "  ⚠️  Listando contenido de directorios..."
            ls -la . 2>/dev/null || true
            ls -la scripts/ 2>/dev/null || true
            SCRIPT_PATH=""
        fi
        
        if [ -n "$SCRIPT_PATH" ]; then
            # Configurar NODE_PATH para que Node.js encuentre los módulos
            export NODE_PATH=/app/node_modules:$NODE_PATH
            echo "  📍 NODE_PATH configurado: $NODE_PATH"
            echo "  🚀 Ejecutando: node $SCRIPT_PATH"
            node "$SCRIPT_PATH" || echo "  ⚠️  Error configurando usuarios, continuando..."
        else
            echo "  ⚠️  No se puede configurar usuarios automáticamente"
            echo "  💡 Configura manualmente usando el panel de administración"
        fi
    else
        echo "  ✅ DB ya inicializada con usuarios"
        
        # Verificar específicamente si existe SUPER_ADMIN
        SUPER_ADMIN_COUNT=$(node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
                .then(count => { console.log(count); process.exit(0); })
                .catch(err => { console.error('0'); process.exit(0); })
                .finally(() => prisma.\$disconnect());
        " 2>/dev/null || echo "0")
        
        if [ "$SUPER_ADMIN_COUNT" = "0" ]; then
            echo "  ⚠️  SUPER_ADMIN no encontrado. Ejecutando actualización de usuarios..."
            
             # Intentar con ruta relativa primero
            if [ -f "scripts/setup-users-production.js" ]; then
                SCRIPT_PATH="scripts/setup-users-production.js"
            # Intentar con ruta absoluta
            elif [ -f "/app/scripts/setup-users-production.js" ]; then
                SCRIPT_PATH="/app/scripts/setup-users-production.js"
            else
                SCRIPT_PATH=""
            fi
            
            if [ -n "$SCRIPT_PATH" ]; then
                export NODE_PATH=/app/node_modules:$NODE_PATH
                node "$SCRIPT_PATH" || echo "  ⚠️  Error creando Super Admin, continuando..."
            fi
        fi
    fi
else
    echo "  ❌ DATABASE_URL no configurada"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 INICIANDO SERVIDOR NEXT.JS"
echo "═══════════════════════════════════════════════════════════════════"
echo "  📂 Working directory: $(pwd)"
echo "  🌐 Hostname: ${HOSTNAME:-0.0.0.0}"
echo "  🔌 Port: ${PORT:-3000}"
echo "  🎯 Node version: $(node --version)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Verificar que server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ ERROR: server.js no encontrado en $(pwd)"
    echo "📋 Contenido del directorio:"
    ls -la
    exit 1
fi

exec node server.js
