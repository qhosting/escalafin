
# 📋 Instrucciones para EasyPanel - Post Fix de Symlinks

## 🎯 Situación Actual

✅ **Fix aplicado exitosamente:**
- Symlinks problemáticos eliminados
- yarn.lock convertidos a archivos reales
- Commit `a3e0853` pushed a GitHub

## 🚀 Pasos a Seguir en EasyPanel

### Paso 1: Pull Latest Changes

1. Abre tu servicio en EasyPanel
2. Ve a la sección **Source** o **Repository**
3. Click en **"Pull Latest"** o **"Rebuild"**
4. Verifica que el commit mostrado sea: `a3e0853`

### Paso 2: Limpiar Build Cache

**⚠️ IMPORTANTE:** Debes limpiar el cache para que los cambios surtan efecto

1. Ve a **Settings** → **Advanced**
2. Busca **"Clear Build Cache"** o **"Clean Build"**
3. Click en el botón para limpiar cache
4. Confirma la acción

### Paso 3: Rebuild

1. Regresa a la vista principal del servicio
2. Click en **"Rebuild"** o **"Deploy"**
3. Espera a que el build complete

### Paso 4: Monitorear Logs

Durante el build, verifica en los logs:

#### ✅ Señales de Éxito:

```
✓ yarn.lock found
✓ Installing dependencies...
✓ Dependencies installed successfully
✓ Building Next.js application...
✓ Build completed successfully
```

#### ❌ Si ves errores:

```bash
# Error de archivo no encontrado
yarn.lock: No such file or directory

# Solución:
# 1. Verifica que el commit correcto está siendo usado
# 2. Limpia el cache nuevamente
# 3. Intenta rebuild de nuevo
```

### Paso 5: Verificar Variables de Entorno

Asegúrate de que todas las variables estén configuradas:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_BUCKET_NAME=...
# ... etc
```

### Paso 6: Probar la Aplicación

1. Una vez que el deployment esté completo
2. Abre la URL de tu aplicación
3. Verifica:
   - ✅ Login funciona
   - ✅ Registro funciona  
   - ✅ Dashboard carga correctamente
   - ✅ No hay errores en la consola del navegador

## 🔧 Troubleshooting

### Problema 1: Build falla con "yarn.lock not found"

**Solución:**
```bash
# En EasyPanel:
1. Settings → Advanced → Clear Build Cache
2. Settings → Source → Pull Latest
3. Verify commit: a3e0853
4. Rebuild
```

### Problema 2: Build tarda mucho

**Causa:** El cache corrupto puede hacer que el build sea lento

**Solución:**
- Espera pacientemente
- Si después de 15 minutos no progresa, cancela y vuelve a intentar
- Asegúrate de que el cache fue limpiado

### Problema 3: Errores de dependencias

**Si ves errores como:**
```
error Can't find package "@prisma/client"
```

**Solución:**
```bash
# En el Dockerfile, verifica que el proceso sea:
1. COPY package*.json
2. npm ci --only=production
3. COPY prisma/
4. npx prisma generate
5. COPY resto de archivos
```

## 📊 Checklist de Verificación

### Pre-Deployment
- [x] Symlinks eliminados
- [x] Archivos reales restaurados
- [x] Commit pushed a GitHub
- [ ] EasyPanel pull latest changes
- [ ] Build cache limpiado

### Post-Deployment
- [ ] Build completado sin errores
- [ ] Aplicación accesible
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Base de datos conecta

## 🆘 Si Nada Funciona

### Opción 1: Force Rebuild

```bash
# En EasyPanel Terminal (si está disponible):
cd /app
rm -rf .next node_modules
npm ci
npm run build
npm start
```

### Opción 2: Verificar Logs Detallados

```bash
# En los logs de build, busca específicamente:
grep -i "yarn.lock" logs.txt
grep -i "symlink" logs.txt
grep -i "error" logs.txt
```

### Opción 3: Contactar Soporte

Si después de estos pasos sigue fallando:

1. **Captura de pantalla** de los logs del error
2. **Nota el commit hash** que está siendo usado
3. **Verifica** que el archivo existe en GitHub: 
   https://github.com/qhosting/escalafin/blob/main/app/yarn.lock
4. Contacta al soporte de EasyPanel con esta información

## 📞 Información de Contacto

- **GitHub Repo:** https://github.com/qhosting/escalafin
- **Commit Fix:** a3e0853
- **Documentación:** Ver `FIX_SYMLINKS_29_OCT_2025.md`

---

## ✨ Resultado Esperado

Después de seguir estos pasos:

✅ Build exitoso  
✅ Deployment sin errores  
✅ Aplicación funcional  
✅ Sin problemas de symlinks  

**¡Tu aplicación debería estar funcionando correctamente! 🎉**

---

**Última actualización:** 29 de Octubre de 2025  
**Commit:** a3e0853
