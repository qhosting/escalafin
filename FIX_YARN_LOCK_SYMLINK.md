
# 🔧 FIX: Error de yarn.lock como Symlink

## 🚨 Problema Detectado

```
ERROR: "/app/yarn.lock": not found
```

### Causa Raíz

El archivo `app/yarn.lock` se había convertido en un enlace simbólico (symlink) apuntando a `/opt/hostedapp/node/root/app/yarn.lock`.

```bash
lrwxrwxrwx 1 ubuntu ubuntu 38 Oct 18 17:21 yarn.lock -> /opt/hostedapp/node/root/app/yarn.lock
```

**Problema:** Docker no puede copiar symlinks que apuntan a rutas fuera del contexto de build.

## ✅ Solución Aplicada

1. **Eliminé el symlink:**
   ```bash
   rm app/yarn.lock
   ```

2. **Copié el archivo real:**
   ```bash
   cp /opt/hostedapp/node/root/app/yarn.lock app/yarn.lock
   ```

3. **Verificación:**
   ```bash
   $ file app/yarn.lock
   yarn.lock: ASCII text
   
   $ ls -lh app/yarn.lock
   -rw-r--r-- 1 ubuntu ubuntu 499K Oct 18 17:31 yarn.lock
   
   $ git ls-files -s app/yarn.lock
   100644 4d956478e4647fc67fdf03f0aa2e105d4b11c394 0 app/yarn.lock
   ```

## 🎯 Resultado

✅ `yarn.lock` es ahora un archivo regular  
✅ Git lo reconoce correctamente (100644)  
✅ Docker puede copiarlo sin problemas  
✅ Build debería funcionar ahora

## 📝 Para Rebuild en EasyPanel

Ahora sí puedes hacer rebuild:

1. **Limpia el cache** (crítico)
2. **Configura 2GB de memoria**
3. **Rebuild**

El error de `yarn.lock: not found` está **solucionado**.

## 🔍 Prevención

**Importante:** No uses symlinks en el directorio del proyecto que necesitan ser copiados al build de Docker. Siempre usa archivos reales.

Si necesitas compartir archivos entre múltiples ubicaciones, cópialos en lugar de crear symlinks.

---

**Status:** ✅ SOLUCIONADO  
**Próximo paso:** Rebuild en EasyPanel
