
# 🚀 INSTRUCCIONES INMEDIATAS DE DESPLIEGUE EN EASYPANEL

**Fecha:** 29 de Octubre 2025  
**Estado:** ✅ Todo listo para desplegar  
**Último commit:** `ecacaac` - Phase 2 Chatwoot integration complete

---

## 📦 CAMBIOS IMPLEMENTADOS

### ✅ Fase 1: Google Drive Integration
- Sistema de almacenamiento unificado
- Compatibilidad con Google Drive y almacenamiento local
- Panel de configuración en Admin Dashboard
- Estructura de carpetas automática para cada cliente

### ✅ Fase 2: Chatwoot Integration
- Widget de chat en tiempo real para clientes
- Panel de administración de Chatwoot
- Integración con notificaciones
- API endpoints para Chatwoot

### ✅ Total de módulos activos: **19**

---

## 🎯 PASOS PARA DESPLEGAR EN EASYPANEL

### **PASO 1: Acceder a EasyPanel**
1. Ve a tu panel de EasyPanel
2. Selecciona el proyecto **escalafin**
3. Ve a la sección **Build & Deploy**

---

### **PASO 2: Actualizar desde GitHub**
```
⚙️ En la sección de Build:
   • Click en "Pull from GitHub"
   • Verificar que está en la rama: main
   • Confirmar que el último commit es: ecacaac
```

---

### **PASO 3: Limpiar Cache de Build**
```
⚙️ Importante para aplicar los cambios:
   1. Click en "⋯" (menú de opciones)
   2. Seleccionar "Clear Build Cache"
   3. Confirmar la acción
```

---

### **PASO 4: Verificar Variables de Entorno**

#### **Variables Críticas - Google Drive:**
```bash
# Google Drive (Opcional - si ya configuraste tu cuenta)
GOOGLE_DRIVE_CLIENT_ID=tu_client_id
GOOGLE_DRIVE_CLIENT_SECRET=tu_client_secret
GOOGLE_DRIVE_REDIRECT_URI=tu_redirect_uri
GOOGLE_DRIVE_REFRESH_TOKEN=tu_refresh_token

# Si no tienes cuenta aún, el sistema usará almacenamiento local
```

#### **Variables Críticas - Chatwoot:**
```bash
# Chatwoot (Ya configurado)
CHATWOOT_WEBSITE_TOKEN=jnJFd3e9FVkotBYoJ6Rgdjyk
CHATWOOT_BASE_URL=https://chat.whatscloud.siet
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_API_ACCESS_TOKEN=59sqgytog1omHFmToDUTXoJF
```

#### **Variables Base - Ya existentes:**
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
NODE_ENV=production
```

---

### **PASO 5: Rebuild del Servicio**
```
🔨 Iniciar rebuild:
   1. Click en "Rebuild Service"
   2. Esperar a que complete el build (3-5 minutos)
   3. Observar los logs en tiempo real
```

---

### **PASO 6: Verificar Logs del Build**

#### **✅ Buscar estas líneas de éxito:**
```bash
# Build exitoso
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages

# Migraciones de Prisma
✅ Prisma migrations applied successfully

# Scripts de producción
✅ ESCALAFIN MVP - STARTUP SCRIPT v2
✅ Next.js server iniciado correctamente
✅ SISTEMA INICIADO - Puerto 3000 activo

# Usuarios de prueba (opcional)
✅ USUARIOS DE PRUEBA CONFIGURADOS EXITOSAMENTE
```

#### **❌ Si hay errores, buscar:**
```bash
ERROR: ...
WARN: ...
Failed to ...
```

---

### **PASO 7: Verificar Aplicación en Vivo**

#### **7.1 Acceder al Dashboard**
```
🌐 URL: https://demo.escalafin.com
   o la URL configurada en tu EasyPanel
```

#### **7.2 Verificar Login**
```
✅ Credenciales de prueba:

👨‍💼 ADMINISTRADOR:
   Email:    admin@escalafin.com
   Password: admin123

👔 ASESOR:
   Email:    asesor@escalafin.com
   Password: asesor123

👤 CLIENTE:
   Email:    cliente@escalafin.com
   Password: cliente123
```

---

### **PASO 8: Verificar Nuevas Funcionalidades**

#### **8.1 Dashboard de Admin - Módulos Nuevos:**
```
✅ Verificar estos 2 módulos nuevos:

📁 Almacenamiento (Storage)
   • Click en "Almacenamiento"
   • Verificar selector: Google Drive / Local Storage
   • Verificar estado de conexión

💬 Chatwoot
   • Click en "Chatwoot"
   • Verificar widget de chat
   • Verificar configuración
```

#### **8.2 Widget de Chat (Para Clientes):**
```
✅ Login como CLIENTE y verificar:

   • Widget de chat en esquina inferior derecha
   • Color: Azul (#4F46E5)
   • Click abre ventana de chat
   • Conecta con Chatwoot
```

#### **8.3 Módulos Existentes (deben seguir funcionando):**
```
✅ Verificar acceso a:
   1. Dashboard
   2. Usuarios
   3. Clientes
   4. Solicitudes de Crédito
   5. Préstamos
   6. Pagos
   7. Reportes
   8. Analytics
   9. Scoring
   10. Notificaciones
   11. Configuración
   12. Auditoría
   13. WhatsApp
   14. Recargas de Mensajes
   15. Gestión de Archivos
   16. Gestión de Módulos
   17. Almacenamiento (NUEVO)
   18. Chatwoot (NUEVO)
```

---

## 🐛 TROUBLESHOOTING

### **Problema 1: Build falla con errores de dependencias**
```bash
💡 Solución:
   1. Verificar que package-lock.json se actualizó
   2. Clear build cache
   3. Rebuild
```

### **Problema 2: Widget de Chatwoot no aparece**
```bash
💡 Verificar:
   1. CHATWOOT_WEBSITE_TOKEN está configurado
   2. CHATWOOT_BASE_URL es correcto
   3. Limpiar cache del navegador (Ctrl+F5)
```

### **Problema 3: Módulos no aparecen**
```bash
💡 Solución:
   1. Verificar que la migración de Prisma se ejecutó
   2. Verificar que los scripts de startup se ejecutaron
   3. Revisar logs del container
```

### **Problema 4: Error 500 o 404**
```bash
💡 Verificar:
   1. DATABASE_URL es correcto
   2. Migraciones aplicadas correctamente
   3. Logs del servidor (runtime logs)
```

---

## 📊 VERIFICACIÓN FINAL - CHECKLIST

```
✅ Checks antes de considerar completado:

INFRAESTRUCTURA:
[ ] Build completó sin errores
[ ] Container está corriendo (status: running)
[ ] Health check pasa (sin errores en logs)
[ ] URL pública accesible

AUTENTICACIÓN:
[ ] Login funciona para ADMIN
[ ] Login funciona para ASESOR  
[ ] Login funciona para CLIENTE
[ ] Redirect después de login funciona

MÓDULOS NUEVOS:
[ ] Panel de Almacenamiento visible en Admin
[ ] Configuración de Google Drive accesible
[ ] Widget de Chatwoot visible para clientes
[ ] Panel de Chatwoot accesible en Admin

MÓDULOS EXISTENTES:
[ ] Todos los 17 módulos anteriores funcionan
[ ] No hay errores en consola del navegador
[ ] Navegación entre páginas funciona
[ ] API endpoints responden correctamente

RENDIMIENTO:
[ ] Páginas cargan en < 2 segundos
[ ] No hay memory leaks en logs
[ ] CPU y RAM dentro de límites normales
```

---

## 🎯 SIGUIENTE PASO DESPUÉS DEL DEPLOY

Una vez verificado que todo funciona:

### **Configurar Google Drive (Opcional)**
Si deseas activar Google Drive:
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Drive API
3. Crear credenciales OAuth 2.0
4. Configurar variables de entorno en EasyPanel
5. Restart del servicio

> **Nota:** El sistema funciona perfectamente con almacenamiento local mientras tanto

---

## 📝 DOCUMENTACIÓN ADICIONAL

- **Setup completo de Google Drive:** Ver `GOOGLE_DRIVE_SETUP_GUIDE.md`
- **Fase 1 completada:** Ver `FASE_1_GOOGLE_DRIVE_COMPLETADA.md`
- **Fase 2 completada:** Ver `FASE_2_CHATWOOT_COMPLETADA.md`
- **Variables de entorno:** Ver `VARIABLES_ENTORNO_COMPLETAS.md`

---

## ✅ RESUMEN EJECUTIVO

```
📦 CAMBIOS PUSHEADOS: ✅
🔧 CONFIGURACIÓN: ✅
📚 DOCUMENTACIÓN: ✅
🧪 TESTING LOCAL: ✅

🚀 LISTO PARA DEPLOY EN EASYPANEL
```

**Commit actual:** `ecacaac` - Phase 2 Chatwoot integration complete  
**Rama:** `main`  
**Repositorio:** https://github.com/qhosting/escalafin

---

**¿NECESITAS AYUDA?**
Si encuentras algún problema durante el deploy, proporciona:
1. Logs del build
2. Logs del runtime
3. Mensaje de error específico
4. Screenshot si es posible

---

*Documento generado: 29 de Octubre 2025*  
*Versión: 1.0*
