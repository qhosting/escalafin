# 🔧 FIX: Scripts Folder Missing en Contenedor Docker

**Fecha:** 28 de Octubre, 2025
**Commit:** 895f6c4
**Problema:** `setup-users-production.js` no encontrado en runtime

## 🎯 Problema Identificado

Durante el despliegue en EasyPanel, el sistema mostraba:
```
⚠️  scripts/setup-users-production.js no encontrado, continuando...
```

**Causa raíz:** El Dockerfile no estaba copiando la carpeta `scripts/` al contenedor final, por lo que el archivo `setup-users-production.js` no existía en runtime.

## ✅ Solución Implementada

### Cambio en Dockerfile (línea 142)

**Antes:**
```dockerfile
# Copy Prisma for migrations and database sync
COPY --from=builder /app/prisma ./prisma
...
# Copy startup scripts (adaptados de CitaPlanner)
COPY --chown=nextjs:nodejs start-improved.sh ./start-improved.sh
```

**Después:**
```dockerfile
# Copy Prisma for migrations and database sync
COPY --from=builder /app/prisma ./prisma
...
# Copy scripts directory (includes setup-users-production.js and other utilities)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy startup scripts (adaptados de CitaPlanner)
COPY --chown=nextjs:nodejs start-improved.sh ./start-improved.sh
```

## 📦 Archivos Ahora Incluidos en Contenedor

```
/app/
  ├── scripts/
  │   ├── setup-users-production.js  ✅ (AHORA INCLUIDO)
  │   ├── seed.ts
  │   ├── setup-test-users.ts
  │   └── ...otros scripts
  ├── start-improved.sh
  ├── emergency-start.sh
  ├── server.js
  └── ...resto de archivos
```

## 🚀 Beneficios

1. ✅ **Configuración automática de usuarios** durante el primer despliegue
2. ✅ **Scripts de utilidad disponibles** en el contenedor para operaciones manuales
3. ✅ **Logs completos** mostrando las credenciales de prueba creadas
4. ✅ **Compatibilidad total** con el proceso de inicio del contenedor

## 📋 Usuarios de Prueba Configurados

Una vez desplegado correctamente, se crearán automáticamente:

| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | admin@escalafin.com | admin123 |
| ASESOR | asesor@escalafin.com | asesor123 |
| CLIENTE | cliente@escalafin.com | cliente123 |

## 🔄 Próximos Pasos para Desplegar

En EasyPanel:

1. **Pull Latest Commit:**
   - Ve a tu app en EasyPanel
   - En "GitHub", haz clic en "Pull Latest"
   - Verifica que esté en commit `895f6c4` o posterior

2. **Clear Build Cache:**
   - En el menú del proyecto, selecciona "Clear Build Cache"
   - Confirma la acción

3. **Rebuild:**
   - Haz clic en "Rebuild"
   - Espera a que termine el build (5-10 min aprox)

4. **Verifica los Logs:**
   ```bash
   # En los logs de startup deberías ver:
   🌱 Configurando usuarios de prueba...
   ✅ ADMIN    - admin@escalafin.com
   ✅ ASESOR   - asesor@escalafin.com
   ✅ CLIENTE  - cliente@escalafin.com
   ```

5. **Test Login:**
   - Ve a tu URL de EasyPanel
   - Prueba login con cualquiera de los usuarios de prueba

## ✅ Verificación del Fix

Para verificar que el fix funcionó correctamente:

```bash
# En los logs del contenedor deberías ver:
🔧 CONFIGURANDO USUARIOS DE PRUEBA - ESCALAFIN
═══════════════════════════════════════════════════════════════════
✅ ADMIN    - admin@escalafin.com
✅ ASESOR   - asesor@escalafin.com
✅ CLIENTE  - cliente@escalafin.com
═══════════════════════════════════════════════════════════════════
```

## 📚 Referencias

- **Commit anterior:** 133834d (sin carpeta scripts)
- **Commit con fix:** 895f6c4 (carpeta scripts incluida)
- **Script afectado:** `start-improved.sh` (línea ~75)
- **Ubicación del script:** `/app/scripts/setup-users-production.js`

## 🔍 Debugging

Si aún no funciona después del fix:

1. **Verificar que el script existe en el contenedor:**
   ```bash
   ls -la /app/scripts/
   ```

2. **Verificar permisos:**
   ```bash
   ls -la /app/scripts/setup-users-production.js
   ```

3. **Ejecutar manualmente:**
   ```bash
   cd /app
   node scripts/setup-users-production.js
   ```

## 🎉 Estado Final

✅ **RESUELTO:** La carpeta `scripts/` ahora se copia correctamente al contenedor final.  
✅ **TESTEADO:** Verificado localmente que el script está presente en el build.  
✅ **PUSHED:** Cambios subidos a GitHub (main branch, commit 895f6c4).  
🚀 **LISTO:** Para desplegar en EasyPanel con pull + rebuild.

---

**Autor:** DeepAgent  
**Versión:** 1.0  
**Estado:** ✅ Completado y Verificado
