
#!/bin/bash

# ✅ POST-DEPLOY CHECK - EscalaFin MVP
# Verifica que el deploy en EasyPanel fue exitoso

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
CHECKS=0

# Logging functions
log_header() {
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${BLUE}$1${NC}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
}

log_check() {
    echo -e "${BLUE}🔍 Verificando:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    CHECKS=$((CHECKS + 1))
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Parámetros
APP_URL="${1:-}"

if [ -z "$APP_URL" ]; then
    log_header "❌ Error: URL no proporcionada"
    echo ""
    echo "Uso: $0 <URL_DE_TU_APP>"
    echo ""
    echo "Ejemplo:"
    echo "  $0 https://escalafin.example.com"
    echo ""
    exit 1
fi

# Start
log_header "✅ POST-DEPLOY CHECK - EscalaFin MVP"
echo "URL: $APP_URL"
START_TIME=$(date +%s)

# ═══════════════════════════════════════════════════════════════
# 1. CONECTIVIDAD BÁSICA
# ═══════════════════════════════════════════════════════════════
log_header "🌐 1. Verificando Conectividad"

log_check "Resolviendo DNS"
if host "$(echo "$APP_URL" | sed 's|https\?://||' | sed 's|/.*||')" > /dev/null 2>&1; then
    log_success "DNS resuelve correctamente"
else
    log_error "No se puede resolver el DNS"
fi

log_check "HTTP Response"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log_success "Servidor responde con 200 OK"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    log_success "Servidor responde con redirect ($HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    log_error "No se puede conectar al servidor"
else
    log_warning "Servidor responde con código: $HTTP_CODE"
fi

log_check "Response Time"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL" 2>/dev/null || echo "0")
if [ "$RESPONSE_TIME" != "0" ]; then
    log_info "Tiempo de respuesta: ${RESPONSE_TIME}s"
    
    # Evaluar tiempo de respuesta
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        log_success "Tiempo de respuesta excelente (< 2s)"
    elif (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
        log_warning "Tiempo de respuesta aceptable (< 5s)"
    else
        log_warning "Tiempo de respuesta lento (> 5s)"
    fi
fi

log_check "SSL Certificate"
if [[ "$APP_URL" == https://* ]]; then
    if curl -s --head "$APP_URL" > /dev/null 2>&1; then
        log_success "Certificado SSL válido"
    else
        log_warning "Problemas con certificado SSL"
    fi
else
    log_info "No se usa HTTPS (recomendado para producción)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. CONTENIDO DE LA PÁGINA
# ═══════════════════════════════════════════════════════════════
log_header "📄 2. Verificando Contenido"

log_check "Descargando página principal"
PAGE_CONTENT=$(curl -s "$APP_URL" 2>/dev/null || echo "")

if [ -n "$PAGE_CONTENT" ]; then
    log_success "Contenido descargado"
    
    # Verificar Next.js
    log_check "Next.js"
    if echo "$PAGE_CONTENT" | grep -q "next" || echo "$PAGE_CONTENT" | grep -q "_next"; then
        log_success "Next.js detectado"
    else
        log_warning "Next.js NO detectado (puede ser normal)"
    fi
    
    # Verificar errores comunes
    log_check "Errores en página"
    if echo "$PAGE_CONTENT" | grep -qi "error\|404\|500\|not found"; then
        log_warning "Posibles errores detectados en la página"
    else
        log_success "No se detectaron errores obvios"
    fi
    
    # Verificar título
    PAGE_TITLE=$(echo "$PAGE_CONTENT" | grep -o "<title>[^<]*</title>" | sed 's/<title>\(.*\)<\/title>/\1/' || echo "")
    if [ -n "$PAGE_TITLE" ]; then
        log_info "Título de página: $PAGE_TITLE"
    fi
else
    log_error "No se pudo descargar el contenido"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. ENDPOINTS CRÍTICOS
# ═══════════════════════════════════════════════════════════════
log_header "🔌 3. Verificando Endpoints Críticos"

# API Health
log_check "/api/health"
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" 2>/dev/null || echo "000")
if [ "$HEALTH_CODE" = "200" ]; then
    log_success "Health check endpoint responde OK"
elif [ "$HEALTH_CODE" = "404" ]; then
    log_info "Health check endpoint no configurado (opcional)"
else
    log_warning "Health check endpoint responde: $HEALTH_CODE"
fi

# API Auth (NextAuth)
log_check "/api/auth/signin"
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/auth/signin" 2>/dev/null || echo "000")
if [ "$AUTH_CODE" = "200" ]; then
    log_success "NextAuth endpoint responde OK"
else
    log_warning "NextAuth endpoint responde: $AUTH_CODE"
fi

# Login page
log_check "/login"
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/login" 2>/dev/null || echo "000")
if [ "$LOGIN_CODE" = "200" ]; then
    log_success "Página de login responde OK"
else
    log_warning "Página de login responde: $LOGIN_CODE"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. RECURSOS ESTÁTICOS
# ═══════════════════════════════════════════════════════════════
log_header "📦 4. Verificando Recursos Estáticos"

# Favicon
log_check "favicon.ico"
FAVICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/favicon.ico" 2>/dev/null || echo "000")
if [ "$FAVICON_CODE" = "200" ]; then
    log_success "Favicon carga correctamente"
else
    log_info "Favicon no encontrado (opcional)"
fi

# Next.js static assets
log_check "_next/static"
STATIC_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/_next/static/css/" 2>/dev/null || echo "000")
if [ "$STATIC_CODE" = "200" ] || [ "$STATIC_CODE" = "403" ]; then
    log_success "Archivos estáticos de Next.js disponibles"
else
    log_warning "Problemas con archivos estáticos"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. HEADERS DE SEGURIDAD
# ═══════════════════════════════════════════════════════════════
log_header "🔒 5. Verificando Headers de Seguridad"

HEADERS=$(curl -s -I "$APP_URL" 2>/dev/null || echo "")

# X-Frame-Options
log_check "X-Frame-Options"
if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    log_success "X-Frame-Options presente"
else
    log_info "X-Frame-Options ausente (considera agregarlo)"
fi

# Strict-Transport-Security
if [[ "$APP_URL" == https://* ]]; then
    log_check "Strict-Transport-Security"
    if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
        log_success "HSTS habilitado"
    else
        log_info "HSTS no configurado (considera habilitarlo)"
    fi
fi

# Content-Type
log_check "Content-Type"
if echo "$HEADERS" | grep -qi "Content-Type"; then
    CONTENT_TYPE=$(echo "$HEADERS" | grep -i "Content-Type" | head -1)
    log_info "$CONTENT_TYPE"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_header "📊 Resumen de Verificación"

echo -e "${GREEN}Checks exitosos: $CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errores: $ERRORS${NC}"
echo -e "${BLUE}Duración: ${DURATION}s${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    log_header "✅ POST-DEPLOY CHECK EXITOSO"
    echo ""
    echo "Tu aplicación está corriendo correctamente! 🎉"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Prueba el login manualmente"
    echo "  2. Verifica funcionalidades críticas"
    echo "  3. Monitorea logs en EasyPanel por 30 minutos"
    echo "  4. Revisa métricas en EasyPanel (CPU, memoria)"
    echo ""
    echo "Accede a tu aplicación en: $APP_URL"
    echo ""
    exit 0
else
    log_header "⚠️  POST-DEPLOY CHECK CON ERRORES"
    echo ""
    echo "Se encontraron $ERRORS errores."
    echo ""
    echo "Acciones recomendadas:"
    echo "  1. Revisa los logs en EasyPanel"
    echo "  2. Verifica variables de entorno"
    echo "  3. Consulta ESTRATEGIA_DEPLOY_EASYPANEL.md"
    echo "  4. Si persiste, considera rollback"
    echo ""
    exit 1
fi
