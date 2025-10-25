
# 🔧 FIX: Error yarn.lock en Docker Build

## 🚨 Error Original

```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref aafb015b-bb61-4a88-9150-63157437e42f::
zmn7uqvkzurubc4583ubppymm: "/app/yarn.lock": not found
```

## 🔍 Causa Raíz

El archivo `app/yarn.lock` era un **symlink** (enlace simbólico) que apuntaba a:
```
/opt/hostedapp/node/root/app/yarn.lock
```

**Problema:** Docker no puede copiar symlinks durante el build porque el destino del symlink no existe en el contexto de construcción de Docker.

## ✅ Solución Aplicada

1. **Convertir symlink a archivo real:**
   ```bash
   cd app
   cp -L yarn.lock yarn.lock.tmp  # Copia siguiendo el symlink
   rm yarn.lock                    # Elimina el symlink
   mv yarn.lock.tmp yarn.lock      # Renombra a nombre original
   ```

2. **Verificación:**
   ```bash
   ls -la yarn.lock
   # Antes: lrwxrwxrwx (indica symlink)
   # Ahora:  -rw-r--r-- (indica archivo regular)
   ```

3. **Commit y Push:**
   ```bash
   git add app/yarn.lock
   git commit -m "fix: Convertir yarn.lock de symlink a archivo real para Docker build"
   git push origin main
   ```

## 📊 Resultado

- ✅ Archivo `yarn.lock` convertido a archivo regular (509KB)
- ✅ Cambios sincronizados con GitHub (commit 2776a27)
- ✅ Docker ahora puede copiar el archivo correctamente
- ✅ Build debería completarse sin errores

## 🚀 Próximo Paso en EasyPanel

1. **Force Deploy** o **Rebuild** en EasyPanel
2. El build ahora encontrará `yarn.lock` correctamente
3. Verifica los logs del build para confirmar éxito

## ⚠️ Importante sobre NEXTAUTH_URL

Si estás usando el dominio `https://escalafin.com`, asegúrate de actualizar en EasyPanel:

```bash
NEXTAUTH_URL=https://escalafin.com
```

**Requisitos para usar dominio custom:**

1. **Configurar DNS:**
   - Agrega un registro A o CNAME apuntando a la IP de EasyPanel
   - Ejemplo:
     ```
     Type: A
     Name: @  (o escalafin.com)
     Value: [IP de tu servidor EasyPanel]
     ```

2. **Configurar Dominio en EasyPanel:**
   - Ve a tu aplicación → Settings → Domains
   - Agrega `escalafin.com`
   - Habilita SSL/TLS (Let's Encrypt)

3. **Verificar Variables de Entorno:**
   ```bash
   NEXTAUTH_URL=https://escalafin.com
   # NO debe ser la URL de easypanel.host
   ```

## 🔍 Verificación del DNS

Para verificar que tu dominio apunta correctamente:

```bash
# Verificar registro A
dig escalafin.com A

# Debería mostrar la IP de tu servidor EasyPanel
```

## 📝 Checklist Post-Deploy

Después del deploy exitoso:

- [ ] ✅ Build completado sin errores
- [ ] ✅ Container iniciado correctamente
- [ ] ✅ DNS apunta a EasyPanel (si usas dominio custom)
- [ ] ✅ SSL configurado y activo
- [ ] ✅ NEXTAUTH_URL coincide con dominio real
- [ ] ✅ Página se visualiza en `https://escalafin.com`
- [ ] ✅ Login funciona correctamente
- [ ] ✅ Base de datos conectada

## 🆘 Si Sigue Sin Funcionar

### 1. Verificar Build Logs

Busca en los logs de EasyPanel:
```
✓ Copiando yarn.lock...
✓ Installing dependencies...
```

### 2. Verificar Runtime Logs

Busca en los logs del container:
```
🚀 Iniciando ESCALAFIN...
✅ server.js encontrado
🎉 EJECUTANDO: node server.js
```

### 3. Verificar Conectividad DNS

```bash
# Desde tu computadora
curl -I https://escalafin.com

# Debería retornar 200 OK o redirección 301/302
```

## 📚 Documentos Relacionados

- `DIAGNOSTICO_RUNTIME_EASYPANEL.md` - Diagnóstico de problemas de runtime
- `PASOS_INMEDIATOS_EASYPANEL.md` - Guía rápida de configuración
- `SOLUCION_VISUALIZACION_EASYPANEL.md` - Solución de problemas de visualización

---

**Fecha de Fix:** 25 de Octubre, 2025
**Commit:** 2776a27
**Estado:** ✅ Resuelto
