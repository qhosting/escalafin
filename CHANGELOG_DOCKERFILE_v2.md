
# Dockerfile v2.0 - Actualización con Scripts Mejorados

## 📅 Fecha: 28 Octubre 2025

## 🎯 Objetivo
Integrar scripts mejorados adaptados de CitaPlanner para mejor logging, error handling y debug capabilities.

## ✨ Cambios Realizados

### 1. Eliminación de Script Embebido
**Antes:**
- start.sh embebido en el Dockerfile con heredoc (RUN cat <<'EOF')
- ~170 líneas de código embebido difícil de mantener

**Después:**
- Scripts externos copiados desde archivos separados
- Más fácil de mantener y versionar

### 2. Scripts Agregados

#### `start-improved.sh` (3.0K)
- **Detección automática de Prisma CLI** (yarn/npx/binary)
- **Logging detallado** con emojis y secciones
- **Verificación robusta** de DATABASE_URL, server.js, etc.
- **Error handling mejorado** con mensajes claros
- **Verificación de estado** de migraciones y DB

#### `emergency-start.sh` (206 bytes)
- **Bypass completo** de checks DB/migraciones
- **Inicio directo** de servidor: `exec node server.js`
- **Útil para:** debug rápido sin esperar validaciones

### 3. CMD Actualizado

**Antes:**
```dockerfile
CMD ["dumb-init", "sh", "/app/start.sh"]
```

**Después:**
```dockerfile
CMD ["dumb-init", "sh", "/app/start-improved.sh"]
```

### 4. Permisos y Ownership
```dockerfile
# Scripts copiados con ownership correcto
COPY --chown=nextjs:nodejs start-improved.sh ./start-improved.sh
COPY --chown=nextjs:nodejs emergency-start.sh ./emergency-start.sh

# Ejecutables desde el inicio
RUN chmod +x /app/start-improved.sh /app/emergency-start.sh
```

### 5. Documentación Mejorada
```dockerfile
# Comentarios en el CMD explican cómo cambiar a modo emergencia
# Use start-improved.sh for better logging and error handling
# To use emergency mode (bypass DB checks), change to: ./emergency-start.sh
```

## 📊 Comparación

| Aspecto | Antes (v1) | Después (v2) |
|---------|-----------|--------------|
| Script inicio | Embebido | Archivo externo |
| Líneas en Dockerfile | ~240 | ~165 (-31%) |
| Logging | Básico | Detallado |
| Error handling | Simple | Robusto |
| Debug mode | No | Sí (emergency-start.sh) |
| Detección Prisma CLI | Manual | Automática |
| Mantenibilidad | Media | Alta |

## 🚀 Uso en Producción

### Normal (recomendado)
```bash
# Ya configurado por defecto en Dockerfile
docker build -t escalafin .
docker run escalafin
```

### Debug (bypass checks)
```dockerfile
# Modificar última línea del Dockerfile:
CMD ["dumb-init", "sh", "/app/emergency-start.sh"]
```

O ejecutar directamente:
```bash
docker exec -it <container> /app/emergency-start.sh
```

## ✅ Beneficios

1. **Código más limpio**: 75 líneas menos en Dockerfile
2. **Mejor mantenibilidad**: Scripts separados fáciles de editar
3. **Logging mejorado**: Diagnóstico más fácil de problemas
4. **Error handling robusto**: Fallbacks automáticos
5. **Debug capabilities**: emergency-start.sh para troubleshooting
6. **Versionado**: Scripts en Git, fácil de revertir

## 🔧 Testing

```bash
# Build local
docker build -t escalafin-test .

# Test normal
docker run --env-file .env escalafin-test

# Test emergency mode (modificar CMD primero)
docker run --env-file .env escalafin-test
```

## 📚 Referencias

- Scripts base: https://github.com/qhosting/citaplanner
- Adaptaciones: Node 18→22, npm→yarn
- Documentación: SCRIPTS_UTILIDAD_IMPLEMENTADOS.md

---

**Versión Dockerfile:** 2.0  
**Commit:** feat: Actualizar Dockerfile con scripts mejorados  
**Estado:** ✅ Listo para deploy
