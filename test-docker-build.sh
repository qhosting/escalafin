
#!/bin/bash

# 🧪 Script de Prueba de Docker Build
# Este script prueba el Dockerfile en etapas

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🧪 Test de Docker Build - EscalaFin MVP              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: Dockerfile no encontrado${NC}"
    echo "Ejecuta este script desde el directorio raíz del proyecto:"
    echo "cd /home/ubuntu/escalafin_mvp && ./test-docker-build.sh"
    exit 1
fi

echo -e "${BLUE}📋 Verificaciones Pre-Build${NC}"
echo "─────────────────────────────────────────────────────────────"

# Verificar archivos críticos
echo -ne "1. Verificando yarn.lock... "
if [ -f "app/yarn.lock" ] && [ ! -L "app/yarn.lock" ]; then
    echo -e "${GREEN}✅ OK (archivo real)${NC}"
else
    echo -e "${RED}❌ FALLO${NC}"
    if [ -L "app/yarn.lock" ]; then
        echo "   yarn.lock es un symlink, convirtiéndolo..."
        cd app && cp -L yarn.lock yarn.lock.real && mv yarn.lock.real yarn.lock && cd ..
        echo -e "   ${GREEN}✅ Convertido a archivo real${NC}"
    else
        echo "   yarn.lock no existe"
        exit 1
    fi
fi

echo -ne "2. Verificando package.json... "
if [ -f "app/package.json" ]; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALLO${NC}"
    exit 1
fi

echo -ne "3. Verificando Dockerfile... "
if grep -q "COPY app/package.json app/package-lock.json\* app/yarn.lock\*" Dockerfile; then
    echo -e "${GREEN}✅ OK (actualizado)${NC}"
else
    echo -e "${YELLOW}⚠️  Dockerfile podría necesitar actualización${NC}"
fi

echo -ne "4. Verificando Docker disponible... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ Docker no instalado${NC}"
    echo ""
    echo "Instala Docker primero:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 Iniciando Build por Etapas${NC}"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Timestamp inicial
START_TIME=$(date +%s)

# Test 1: Stage deps
echo -e "${YELLOW}Test 1/3: Stage 'deps' (dependencias)${NC}"
echo "Comando: docker build --target deps -t escalafin-test-deps ."
echo ""

if docker build --target deps -t escalafin-test-deps -f Dockerfile . 2>&1 | tee /tmp/docker-build-deps.log; then
    echo ""
    echo -e "${GREEN}✅ Stage 'deps' completado exitosamente${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Stage 'deps' falló${NC}"
    echo ""
    echo "Ver logs completos en: /tmp/docker-build-deps.log"
    echo ""
    echo "Últimas 50 líneas del error:"
    tail -50 /tmp/docker-build-deps.log
    exit 1
fi

# Test 2: Stage builder
echo -e "${YELLOW}Test 2/3: Stage 'builder' (compilación)${NC}"
echo "Comando: docker build --target builder -t escalafin-test-builder ."
echo ""
echo "⏳ Este paso puede tomar 2-5 minutos..."
echo ""

if timeout 600 docker build --target builder -t escalafin-test-builder -f Dockerfile . 2>&1 | tee /tmp/docker-build-builder.log; then
    echo ""
    echo -e "${GREEN}✅ Stage 'builder' completado exitosamente${NC}"
    echo ""
    
    # Verificar que standalone se generó
    echo "Verificando standalone output..."
    if docker run --rm escalafin-test-builder ls -la .next/standalone 2>/dev/null | grep -q "server.js"; then
        echo -e "${GREEN}✅ Standalone output verificado (server.js encontrado)${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo verificar standalone output${NC}"
    fi
    echo ""
else
    echo ""
    echo -e "${RED}❌ Stage 'builder' falló${NC}"
    echo ""
    echo "Ver logs completos en: /tmp/docker-build-builder.log"
    echo ""
    echo "Últimas 100 líneas del error:"
    tail -100 /tmp/docker-build-builder.log
    exit 1
fi

# Test 3: Build completo
echo -e "${YELLOW}Test 3/3: Build completo (imagen final)${NC}"
echo "Comando: docker build -t escalafin-mvp ."
echo ""
echo "⏳ Este paso puede tomar 3-7 minutos..."
echo ""

if timeout 900 docker build -t escalafin-mvp -f Dockerfile . 2>&1 | tee /tmp/docker-build-full.log; then
    echo ""
    echo -e "${GREEN}✅ Build completo exitoso${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build completo falló${NC}"
    echo ""
    echo "Ver logs completos en: /tmp/docker-build-full.log"
    echo ""
    echo "Últimas 100 líneas del error:"
    tail -100 /tmp/docker-build-full.log
    exit 1
fi

# Tiempo total
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ TODOS LOS TESTS PASARON                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎉 Build de Docker completado exitosamente${NC}"
echo ""
echo "⏱️  Tiempo total: ${MINUTES}m ${SECONDS}s"
echo ""

# Mostrar información de la imagen
echo "📊 Información de la Imagen:"
echo "─────────────────────────────────────────────────────────────"
docker images escalafin-mvp --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# Siguiente paso
echo "🚀 Próximos Pasos:"
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "1. Probar la imagen localmente:"
echo -e "   ${BLUE}docker run -p 3000:3000 \\${NC}"
echo -e "   ${BLUE}     -e DATABASE_URL=\"postgresql://...\" \\${NC}"
echo -e "   ${BLUE}     -e NEXTAUTH_URL=\"http://localhost:3000\" \\${NC}"
echo -e "   ${BLUE}     -e NEXTAUTH_SECRET=\"tu-secret\" \\${NC}"
echo -e "   ${BLUE}     -e JWT_SECRET=\"otro-secret\" \\${NC}"
echo -e "   ${BLUE}     escalafin-mvp${NC}"
echo ""
echo "2. Subir a Docker Hub (opcional):"
echo -e "   ${BLUE}docker tag escalafin-mvp tu-usuario/escalafin-mvp:latest${NC}"
echo -e "   ${BLUE}docker push tu-usuario/escalafin-mvp:latest${NC}"
echo ""
echo "3. Desplegar en Coolify:"
echo -e "   ${BLUE}./coolify-quick-setup.sh${NC}"
echo ""
echo "4. O desplegar manualmente en cualquier servidor con Docker"
echo ""

# Limpieza opcional
read -p "¿Deseas limpiar las imágenes de test? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Limpiando imágenes de test..."
    docker rmi escalafin-test-deps escalafin-test-builder 2>/dev/null || true
    echo -e "${GREEN}✅ Imágenes de test eliminadas${NC}"
fi

echo ""
echo "✅ Test completado. La imagen 'escalafin-mvp' está lista para usar."
echo ""
