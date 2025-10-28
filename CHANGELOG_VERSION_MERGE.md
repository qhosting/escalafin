# Merge de Versiones: CitaPlanner → EscalaFin

**Fecha:** 28 Octubre 2025  
**Tipo:** Alineación de versiones de dependencias  
**Objetivo:** Reducir variables en troubleshooting usando las mismas versiones que CitaPlanner

---

## 🔄 Cambios Aplicados

### 1. Prisma: 6.17.1 → 6.7.0

**Antes:**
```json
"@prisma/client": "6.17.1",
"prisma": "6.17.1"
```

**Después:**
```json
"@prisma/client": "6.7.0",
"prisma": "6.7.0"
```

**Razón:** Alinear con la versión usada por CitaPlanner

**Pasos ejecutados:**
```bash
cd app
yarn remove @prisma/client prisma
yarn add @prisma/client@6.7.0 prisma@6.7.0
yarn prisma generate
```

---

### 2. Node: 22 → 18

**Antes:**
```dockerfile
FROM node:22-alpine AS base
```

**Después:**
```dockerfile
FROM node:18-alpine AS base
```

**Razón:** Alinear con la versión usada por CitaPlanner

**Cambio:** Solo en Dockerfile, línea 10

---

## 📊 Estado Post-Merge

### Versiones Alineadas ✅

| Dependencia | CitaPlanner | EscalaFin | Estado |
|-------------|-------------|-----------|--------|
| Next.js | 14.2.28 | 14.2.28 | ✅ IGUAL |
| React | 18.2.0 | 18.2.0 | ✅ IGUAL |
| Next-auth | 4.24.11 | 4.24.11 | ✅ IGUAL |
| Prisma | 6.7.0 | 6.7.0 | ✅ **ALINEADO** |
| Node | 18 | 18 | ✅ **ALINEADO** |

**Resultado:** 100% de las versiones críticas ahora coinciden con CitaPlanner

---

## 🎯 Beneficios

1. **Reduce variables** en troubleshooting
2. **Mismas versiones** probadas en CitaPlanner
3. **Elimina** diferencias de versión como posible causa
4. **Facilita** comparación de comportamiento

---

## ⚠️ Nota Importante

Este cambio NO garantiza resolver el problema de visualización porque:

1. Las versiones de Next.js, React y Next-auth **ya eran idénticas**
2. La diferencia en Prisma **no afecta renderizado de UI**
3. El problema más probable está en **configuración/runtime**

**Próximos pasos:** Revisar logs de runtime en EasyPanel

---

## 🔧 Testing Local

```bash
# Test build local
cd /home/ubuntu/escalafin_mvp
docker build -t escalafin-v18 .

# Test run
docker run --env-file .env -p 3000:3000 escalafin-v18
```

---

## 📝 Archivos Modificados

- ✅ `app/package.json` - Prisma 6.7.0
- ✅ `app/yarn.lock` - Actualizado
- ✅ `Dockerfile` - Node 18
- ✅ `app/node_modules/.prisma/client` - Regenerado

---

## 🚀 Deploy

```bash
# Push a GitHub
git add .
git commit -m "chore: Alinear versiones con CitaPlanner (Prisma 6.7.0, Node 18)"
git push origin main

# Rebuild en EasyPanel
1. Pull último commit
2. Limpiar build cache
3. Rebuild
```

---

**Estado:** ✅ Merge completado  
**Versiones:** 100% alineadas con CitaPlanner  
**Listo para:** Deploy y testing
