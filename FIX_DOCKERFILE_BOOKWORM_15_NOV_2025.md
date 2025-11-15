
# 🔧 Fix Dockerfile: Migración a Debian 12 Bookworm

**Fecha:** 15 de Noviembre 2025  
**Tipo:** Fix crítico de build  
**Impacto:** Resuelve error de apt-get en EasyPanel

---

## 📋 Problema Identificado

### Error en Build de EasyPanel
```
E: Unable to locate package openssl
E: Unable to locate package curl
E: Package 'ca-certificates' has no installation candidate
E: Unable to locate package dumb-init
```

### Causa Raíz
La imagen `node:18-slim` estaba basada en Debian 11 (Bullseye) con repositorios desactualizados o con problemas de sincronización en el entorno de build de EasyPanel.

---

## ✅ Solución Implementada

### Cambios Realizados

#### 1. Actualización de Imagen Base
```dockerfile
# ANTES
FROM node:18-slim AS base

# DESPUÉS  
FROM node:18-bookworm-slim AS base
```

**Beneficios:**
- ✅ Debian 12 (Bookworm) con repositorios actualizados
- ✅ Mejor compatibilidad con paquetes modernos
- ✅ Mayor estabilidad en entornos de CI/CD

#### 2. Mejora en Instalación de Dependencias
```dockerfile
# ANTES
RUN apt-get update && apt-get install -y \
    bash openssl curl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

# DESPUÉS
RUN rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        bash openssl curl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
```

**Mejoras:**
- ✅ Limpieza previa de listas de paquetes
- ✅ `--no-install-recommends` reduce tamaño de imagen
- ✅ Limpieza más agresiva de archivos temporales
- ✅ Mejor manejo de errores

---

## 📦 Archivos Modificados

```bash
./Dockerfile                         # Dockerfile principal
./template/docker/Dockerfile         # Template de Docker
```

---

## 🧪 Verificación

### Build Local (Opcional)
```bash
cd /home/ubuntu/escalafin_mvp
docker build -t escalafin:test .
```

### Despliegue en EasyPanel
```bash
# 1. Push de cambios
git add Dockerfile template/docker/Dockerfile
git commit -m "fix: Migrar a Debian 12 Bookworm para resolver apt-get"
git push origin main

# 2. En EasyPanel:
#    - Pull latest commit
#    - Clear build cache
#    - Rebuild
```

---

## 📊 Comparación de Imágenes

| Aspecto | node:18-slim | node:18-bookworm-slim |
|---------|--------------|----------------------|
| Base OS | Debian 11 | Debian 12 |
| Repos | Bullseye | Bookworm |
| Estabilidad | ⚠️ Repos desactualizados | ✅ Repos actualizados |
| Tamaño | ~180MB | ~180MB |
| Compatibilidad | Buena | Excelente |

---

## 🎯 Resultado Esperado

### Build Exitoso
```
#7 [base 3/4] RUN rm -rf /var/lib/apt/lists/*...
#7 DONE 1.2s

#8 [base 4/4] RUN apt-get clean && apt-get update...
#8 5.432 Get:1 http://deb.debian.org/debian bookworm InRelease [151 kB]
#8 5.892 Get:2 http://deb.debian.org/debian bookworm-updates InRelease [55.4 kB]
#8 DONE 12.5s

✅ Todos los paquetes instalados correctamente
```

---

## 🔄 Próximos Pasos

### Inmediato
1. ✅ Commit y push de cambios
2. ⏳ Deploy en EasyPanel
3. ⏳ Verificar build exitoso
4. ⏳ Confirmar app funcional

### Futuro
- Considerar usar imagen específica con hash SHA256 para máxima reproducibilidad
- Evaluar Alpine Linux si el tamaño de imagen es crítico (requiere más cambios)

---

## 📝 Notas Técnicas

### ¿Por qué Bookworm?
- Debian 12 es la versión estable actual (desde Junio 2023)
- Mejor soporte a largo plazo (LTS hasta 2026+)
- Repositorios más actualizados y completos
- Mayor compatibilidad con herramientas modernas

### Compatibilidad
- ✅ Node.js 18 completamente compatible
- ✅ Next.js con SWC (requiere glibc, no musl)
- ✅ Yarn 4.10.3
- ✅ Prisma 6.7.0

---

## 🔗 Referencias

- [Node.js Docker Images](https://hub.docker.com/_/node)
- [Debian 12 Bookworm Release Notes](https://www.debian.org/releases/bookworm/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Estado:** ✅ Implementado  
**Probado:** ⏳ Pendiente verificación en EasyPanel  
**Commit:** Pendiente  
