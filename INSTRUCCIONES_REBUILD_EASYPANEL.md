
# 🔥 Instrucciones para Rebuild en EasyPanel

## ⚠️ Fix Crítico Aplicado - v9.1

Se ha identificado y resuelto un problema crítico que causaba el error:

```
Error: Could not find a production build in the '.next' directory
```

## 🔧 ¿Qué se Corrigió?

**Problema**: La variable `NEXT_OUTPUT_MODE` no estaba definida en el Dockerfile, causando que Next.js no generara el output en modo `standalone`.

**Solución**: Se agregó `ENV NEXT_OUTPUT_MODE=standalone` en el stage de build del Dockerfile.

## 📤 Estado del Código

✅ **Fix aplicado y subido a GitHub**

- Commit: `ea16a97`
- Mensaje: "🔥 Fix crítico v9.1: NEXT_OUTPUT_MODE para standalone output"
- Repositorio: https://github.com/qhosting/escalafin-mvp

## 🚀 Pasos para Aplicar el Fix en EasyPanel

### Opción A: Auto-Deploy (Recomendado)

Si tienes webhook de GitHub configurado en EasyPanel:

1. **Espera unos minutos** - EasyPanel detectará el nuevo commit automáticamente
2. **Monitorea los logs** - Verifica que el build se inicie
3. **Verifica el mensaje** - Busca "✅ Standalone output verificado"

### Opción B: Rebuild Manual

Si el auto-deploy no está configurado:

1. **Accede a EasyPanel**
2. **Ve a tu aplicación** (`escalafin-app`)
3. **Click en "Rebuild"** o **"Deploy"**
4. **Espera el build** (5-8 minutos)
5. **Monitorea los logs**

## 🔍 Verificación del Fix

### Durante el Build

En los logs, deberías ver estas líneas:

```bash
=== Verificando build standalone ===
drwxr-xr-x ... .next/standalone
✅ Standalone output verificado
```

### Al Iniciar el Servidor

```bash
✅ Server started on port 3000
```

### Si el Build Falla

Si ves:
```
❌ ERROR: standalone output no generado
```

Esto indica un problema con Next.js. Verifica:
1. Que `next.config.js` no haya sido modificado manualmente
2. Que las variables de entorno estén correctamente configuradas
3. Que no haya errores de TypeScript o sintaxis

## 📊 Comparación

| Aspecto | Antes (v9.0) | Después (v9.1) |
|---------|--------------|----------------|
| Standalone output | ❌ No se generaba | ✅ Se genera correctamente |
| Error al iniciar | ❌ "Could not find build" | ✅ Inicia correctamente |
| Detección de errores | ⏰ En runtime | ✅ En build time |
| Logs | 😕 Confusos | ✅ Claros y verificados |

## 🎯 Checklist Post-Rebuild

- [ ] Build completado sin errores
- [ ] Mensaje "✅ Standalone output verificado" visible en logs
- [ ] Servidor iniciado: "Server started on port 3000"
- [ ] Health check responde: `https://tu-dominio.com/api/health`
- [ ] Aplicación accesible: `https://tu-dominio.com`
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores

## 🐛 Troubleshooting

### Error: "standalone output no generado"

**Causa posible**: Variables de entorno faltantes

**Solución**:
1. Verifica que `NEXT_OUTPUT_MODE` esté en el Dockerfile (línea 42)
2. Fuerza un rebuild limpio
3. Revisa los logs completos del build

### Error: "Module not found"

**Causa posible**: Cache corrupto

**Solución**:
1. En EasyPanel, click en "Settings"
2. Busca opción de "Clear Build Cache"
3. Rebuild

### Error: Database connection

**Causa posible**: Variables de entorno no configuradas

**Solución**:
1. Verifica `DATABASE_URL` en variables de entorno
2. Asegúrate de usar el hostname interno (ej: `escalafin-db`)
3. Verifica que la base de datos esté running

## 📝 Notas Importantes

### ¿Necesito cambiar las variables de entorno?

**NO**. El fix está en el Dockerfile, no en las variables de runtime.

Las únicas variables que necesitas en EasyPanel son las mismas:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NODE_ENV=production`
- Otras específicas de tu setup (AWS, Openpay, etc.)

### ¿Perderé datos al hacer rebuild?

**NO**. El rebuild solo actualiza la aplicación. La base de datos y los archivos almacenados no se ven afectados.

### ¿Cuánto tarda el rebuild?

**Primera vez después del fix**: 5-8 minutos  
**Siguientes builds**: 3-5 minutos (cache)

## 📞 Si Necesitas Ayuda

Si el rebuild falla o tienes problemas:

1. **Captura los logs completos** del build en EasyPanel
2. **Verifica las variables de entorno**
3. **Consulta**: `FIX_CRITICO_v9.1.md` para detalles técnicos
4. **Revisa**: `EASYPANEL_DEPLOY_GUIDE.md` para troubleshooting general

## ✅ Siguiente Paso

**Ve a EasyPanel ahora y ejecuta el rebuild**

O si tienes auto-deploy configurado, simplemente espera unos minutos.

---

**Versión**: 9.1  
**Fix**: NEXT_OUTPUT_MODE  
**Estado**: ✅ Listo para rebuild  
**Fecha**: 2025-10-15  
