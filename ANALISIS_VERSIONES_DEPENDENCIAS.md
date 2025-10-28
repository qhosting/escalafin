# Análisis Comparativo: Versiones de Dependencias
## CitaPlanner vs EscalaFin

**Fecha:** 28 Octubre 2025  
**Objetivo:** Identificar diferencias en versiones que puedan causar problemas de visualización

---

## 📊 Comparación de Versiones Críticas

| Dependencia | CitaPlanner | EscalaFin | Estado |
|-------------|-------------|-----------|--------|
| **Next.js** | 14.2.28 | 14.2.28 | ✅ IGUAL |
| **React** | 18.2.0 | 18.2.0 | ✅ IGUAL |
| **Next-auth** | 4.24.11 | 4.24.11 | ✅ IGUAL |
| **Prisma** | 6.7.0 | 6.17.1 | ⚠️ DIFERENTE |
| **Node** | 18 | 22 | ⚠️ DIFERENTE |

---

## 🔍 Análisis Detallado

### 1. Prisma: 6.7.0 vs 6.17.1

**Diferencia:** 10 versiones minor (6.7 → 6.17)

**Impacto Potencial:**
- ⚠️ Cambios en generación de cliente
- ⚠️ Posibles cambios en migraciones
- ⚠️ Nuevas features/fixes en 6.17.1

**Riesgo para visualización:** BAJO
- Las versiones de Prisma afectan principalmente la capa de datos
- NO deberían impedir que se visualice la página principal
- Podrían causar errores en consultas DB, pero no en renderizado

**Recomendación:**
```json
// Actualizar EscalaFin a Prisma 6.7.0 (misma que CitaPlanner)
"@prisma/client": "6.7.0",
"prisma": "6.7.0"
```

### 2. Node: 18 vs 22

**Diferencia:** Node 18 (CitaPlanner) vs Node 22 (EscalaFin)

**Impacto Potencial:**
- ⚠️ Cambios en APIs de Node.js
- ⚠️ Compatibilidad con dependencias nativas
- ✅ Next.js 14 soporta ambas versiones

**Riesgo para visualización:** BAJO
- Next.js 14 está testeado con Node 18 y 20+
- Node 22 es más reciente y debería funcionar

**Recomendación:**
- Mantener Node 22 (más reciente)
- O alinear con CitaPlanner usando Node 18

### 3. Dependencias Idénticas ✅

Las siguientes son **IDÉNTICAS** y no causan problemas:
- ✅ Next.js 14.2.28
- ✅ React 18.2.0
- ✅ Next-auth 4.24.11

---

## 🎯 Diagnóstico del Problema Actual

### La página no se visualiza a pesar de puerto correcto

**Causas MÁS PROBABLES:**

1. **❌ No relacionado con versiones de dependencias**
   - Las versiones de Next.js, React y Next-auth son idénticas
   - La diferencia en Prisma NO afecta renderizado de UI

2. **✅ Posibles causas reales:**
   - Variables de entorno incorrectas (`NEXTAUTH_URL`, `NEXT_PUBLIC_*`)
   - Errores de runtime en el servidor (revisar logs de contenedor)
   - Puerto interno vs externo en EasyPanel
   - Health check fallando
   - Proxy/DNS de EasyPanel no apuntando correctamente
   - Server.js no se está ejecutando correctamente

---

## 🔧 Plan de Acción Recomendado

### Opción 1: Alinear Versiones (Conservador)

```bash
cd /home/ubuntu/escalafin_mvp/app

# Actualizar Prisma a la misma versión de CitaPlanner
yarn remove @prisma/client prisma
yarn add @prisma/client@6.7.0 prisma@6.7.0

# Regenerar cliente
yarn prisma generate

# Actualizar Dockerfile para usar Node 18
# FROM node:22-alpine -> FROM node:18-alpine
```

**Beneficios:**
- ✅ Versiones 100% alineadas con CitaPlanner
- ✅ Reduce variables en troubleshooting

**Desventajas:**
- ⚠️ No garantiza resolver el problema de visualización
- ⚠️ Node 18 es más antiguo que Node 22

### Opción 2: Mantener Versiones Actuales (Recomendado)

**Razones:**
- Las diferencias de versión NO explican el problema de visualización
- El problema es de configuración/runtime, no de dependencias
- Node 22 y Prisma 6.17.1 son más recientes y estables

**Acción:**
- ✅ Mantener versiones actuales
- ✅ Enfocarse en logs de runtime
- ✅ Verificar variables de entorno
- ✅ Revisar configuración de EasyPanel

---

## 📝 Checklist de Diagnóstico

Para identificar el problema real:

```bash
# 1. Verificar que el contenedor está corriendo
docker ps | grep escalafin

# 2. Ver logs de runtime (NO de build)
docker logs <container_id> --tail 100

# 3. Verificar proceso Node dentro del contenedor
docker exec -it <container_id> ps aux | grep node

# 4. Probar healthcheck manualmente
docker exec -it <container_id> /app/healthcheck.sh

# 5. Verificar puerto 3000 está escuchando
docker exec -it <container_id> netstat -tulpn | grep 3000

# 6. Probar acceso directo desde dentro del contenedor
docker exec -it <container_id> wget -O- http://localhost:3000
```

---

## 🎯 Conclusión

**¿Las diferencias de versiones causan el problema de visualización?**

**❌ NO**

- Las versiones críticas (Next.js, React, Next-auth) son idénticas
- La diferencia en Prisma (6.7.0 vs 6.17.1) NO afecta renderizado de UI
- El problema es de configuración/runtime, no de compatibilidad de versiones

**Próximos pasos:**
1. Mantener versiones actuales de EscalaFin
2. Revisar logs de runtime del contenedor
3. Verificar variables de entorno
4. Confirmar que server.js se ejecuta correctamente
5. Revisar configuración de puerto en EasyPanel

---

## 📊 Scripts de Comparación

```bash
# Ver todas las diferencias en package.json
diff /tmp/citaplanner/app/package.json /home/ubuntu/escalafin_mvp/app/package.json

# Ver solo dependencias diferentes
comm -3 \
  <(cd /tmp/citaplanner/app && npm ls --depth=0 2>/dev/null | sort) \
  <(cd /home/ubuntu/escalafin_mvp/app && npm ls --depth=0 2>/dev/null | sort)
```

---

**Recomendación Final:** No cambiar versiones. Enfocarse en logs de runtime y configuración de EasyPanel.
