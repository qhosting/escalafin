
#!/bin/bash

# ===============================================
# ESCALAFIN MVP - BUILD DOCKER MANUAL v1.0
# Para ejecutar en GitHub Codespaces o servidor con Docker
# ===============================================

set -e  # Exit on any error

echo "🐳 ESCALAFIN MVP - BUILD DOCKER MANUAL"
echo "======================================"
echo ""

# Verificar Docker disponible
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker no está instalado"
    echo "   Instala Docker o usa GitHub Codespaces"
    exit 1
fi

echo "✅ Docker disponible: $(docker --version)"
echo ""

# Verificar archivos necesarios
echo "🔍 Verificando archivos..."
if [[ ! -f "Dockerfile" ]]; then
    echo "❌ ERROR: Dockerfile no encontrado"
    exit 1
fi

if [[ ! -f "app/package.json" ]]; then
    echo "❌ ERROR: app/package.json no encontrado"
    exit 1
fi

if [[ ! -d "app" ]]; then
    echo "❌ ERROR: directorio app/ no encontrado"
    exit 1
fi

echo "✅ Dockerfile: $(wc -l < Dockerfile) líneas"
echo "✅ app/package.json: encontrado"
echo "✅ app/: $(ls app/ | wc -l) archivos"
echo ""

# Build de la imagen
echo "🏗️ INICIANDO BUILD..."
echo "docker build -t qhosting/escalafin-mvp:latest ."
echo ""

docker build -t qhosting/escalafin-mvp:latest . --no-cache

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ BUILD EXITOSO!"
    echo ""
    
    # Verificar imagen creada
    echo "📋 Imagen creada:"
    docker images | grep escalafin-mvp
    echo ""
    
    # Login y push
    echo "🔐 DOCKER LOGIN REQUERIDO:"
    echo "   Username: qhosting"
    echo "   Password: [Ingresa tu Docker Hub token]"
    echo ""
    
    read -p "¿Realizar push a Docker Hub? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Haciendo login a Docker Hub..."
        docker login -u qhosting
        
        if [[ $? -eq 0 ]]; then
            echo ""
            echo "📤 PUSHING imagen..."
            docker push qhosting/escalafin-mvp:latest
            
            if [[ $? -eq 0 ]]; then
                echo ""
                echo "🎉 ¡ÉXITO TOTAL!"
                echo "✅ Imagen disponible en: https://hub.docker.com/r/qhosting/escalafin-mvp"
                echo ""
                echo "🚀 Para usar la imagen:"
                echo "   docker pull qhosting/escalafin-mvp:latest"
                echo "   docker run -d -p 80:3000 qhosting/escalafin-mvp:latest"
            else
                echo "❌ ERROR: Falló el push a Docker Hub"
                exit 1
            fi
        else
            echo "❌ ERROR: Falló el login a Docker Hub"
            exit 1
        fi
    else
        echo "⏸️ Push cancelado - imagen disponible localmente"
        echo "   Para push manual: docker push qhosting/escalafin-mvp:latest"
    fi
else
    echo ""
    echo "❌ ERROR: BUILD FALLÓ"
    echo "   Revisa los logs arriba para detalles"
    exit 1
fi

echo ""
echo "🎯 BUILD MANUAL COMPLETADO"
