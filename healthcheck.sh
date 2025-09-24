
#!/bin/bash
# Script de health check para Coolify

set -e

# Función para verificar servicios
check_service() {
    local service=$1
    local url=$2
    local timeout=${3:-10}
    
    echo "Verificando $service..."
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo "✅ $service: OK"
        return 0
    else
        echo "❌ $service: FALLA"
        return 1
    fi
}

# Verificar aplicación principal
check_service "Aplicación" "http://localhost:3000/api/health" 30

# Verificar base de datos (si está expuesta)
if nc -z db 5432 2>/dev/null; then
    echo "✅ Base de datos: OK"
else
    echo "❌ Base de datos: FALLA"
    exit 1
fi

# Verificar Redis (si está expuesta)
if nc -z redis 6379 2>/dev/null; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: FALLA"
    exit 1
fi

echo "🎉 Todos los servicios están funcionando"
