
#!/bin/bash

echo "🔧 CONFIGURACIÓN DE USUARIOS DE PRUEBA - ESCALAFIN"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Este script creará/actualizará los usuarios de prueba en la base de datos."
echo ""

# Ir al directorio de la aplicación
cd /home/ubuntu/escalafin_mvp/app || cd /app || {
    echo "❌ ERROR: No se encuentra el directorio de la aplicación"
    exit 1
}

echo "📍 Directorio actual: $(pwd)"
echo ""

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    echo ""
    echo "💡 Para configurarla, ejecuta:"
    echo "   export DATABASE_URL='tu_connection_string'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL configurada"
echo ""

# Verificar que el script existe
if [ ! -f "scripts/setup-test-users.ts" ]; then
    echo "❌ ERROR: scripts/setup-test-users.ts no encontrado"
    exit 1
fi

echo "🚀 Ejecutando script de configuración..."
echo ""

# Ejecutar el script
if command -v npx > /dev/null 2>&1; then
    npx tsx scripts/setup-test-users.ts
elif command -v yarn > /dev/null 2>&1; then
    yarn tsx scripts/setup-test-users.ts
else
    echo "❌ ERROR: No se encuentra npx o yarn"
    exit 1
fi

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE"
    echo ""
    echo "🌐 Puedes iniciar sesión en:"
    echo "   https://tu-dominio.com/auth/login"
    echo ""
else
    echo "❌ ERROR: La configuración falló con código $EXIT_CODE"
    exit $EXIT_CODE
fi
