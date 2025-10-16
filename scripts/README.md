
# 🛠️ Scripts de Deploy - EscalaFin MVP

Scripts automatizados para facilitar el proceso de deploy y troubleshooting.

---

## 📁 Scripts Disponibles

### 1. `pre-deploy-check.sh` ✅

**Propósito:** Verificar que todo está listo antes de hacer deploy

**Cuándo usar:** SIEMPRE antes de cada deploy

**Uso:**
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/pre-deploy-check.sh
```

**Qué verifica:**
- ✅ Archivos críticos existen (Dockerfile, package.json, etc.)
- ✅ Dockerfile está en versión correcta (v16.0+)
- ✅ package.json tiene scripts necesarios
- ✅ next.config.js tiene output: 'standalone'
- ✅ Prisma schema existe
- ✅ Scripts de inicio tienen permisos correctos
- ✅ Git status (cambios sin commitear)
- ✅ Dependencias críticas en package.json
- ✅ Configuración Docker es correcta
- ✅ Variables de entorno en .env.example

**Salida esperada:**
```
✅ PRE-DEPLOY CHECK EXITOSO

Tu proyecto está listo para hacer deploy en EasyPanel! 🚀
```

**Si falla:**
- Lee los mensajes de error
- Corrige los problemas identificados
- Vuelve a ejecutar el script
- Consulta ESTRATEGIA_DEPLOY_EASYPANEL.md para más ayuda

---

### 2. `post-deploy-check.sh` ✅

**Propósito:** Verificar que el deploy fue exitoso

**Cuándo usar:** Inmediatamente después de cada deploy

**Uso:**
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/post-deploy-check.sh https://tu-dominio.com
```

**Qué verifica:**
- 🌐 Conectividad (DNS, HTTP response)
- ⏱️ Tiempo de respuesta
- 🔒 Certificado SSL
- 📄 Contenido de la página
- 🔌 Endpoints críticos (/api/health, /api/auth, /login)
- 📦 Recursos estáticos (_next/static)
- 🔒 Headers de seguridad

**Salida esperada:**
```
✅ POST-DEPLOY CHECK EXITOSO

Tu aplicación está corriendo correctamente! 🎉
```

**Si falla:**
- Revisa logs en EasyPanel
- Verifica variables de entorno
- Consulta la sección de errores comunes
- Considera hacer rollback si el problema persiste

---

### 3. `emergency-rollback.sh` 🚨

**Propósito:** Restaurar la aplicación a un estado anterior estable

**Cuándo usar:**
- Deploy crítico falló
- Aplicación en producción no funciona
- Necesitas restaurar rápidamente

**Uso:**
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/emergency-rollback.sh
```

**Qué hace:**
1. Lista backups disponibles
2. Muestra el backup más reciente
3. Solicita confirmación (escribir "SI")
4. Crea backup del estado actual (por si acaso)
5. Restaura archivos desde el backup
6. Verifica archivos críticos

**ADVERTENCIA:**
- Este script sobrescribe el código actual
- Se crea un backup antes de restaurar
- Solo funciona si existen backups previos

**Después del rollback:**
- Verifica el código restaurado
- Redeploy en EasyPanel si es necesario
- Investiga la causa del problema original

---

### 4. `subir-github.sh` (Existente)

**Propósito:** Subir cambios a GitHub

**Uso:**
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/subir-github.sh
```

---

### 5. `verificacion-github.sh` (Existente)

**Propósito:** Verificar configuración de GitHub

**Uso:**
```bash
cd /home/ubuntu/escalafin_mvp
./scripts/verificacion-github.sh
```

---

## 🎯 Flujo de Trabajo Recomendado

### Deploy Normal

```bash
# 1. Pre-deploy check
./scripts/pre-deploy-check.sh

# 2. Si pasa, commit y push
git add .
git commit -m "feat: nuevas funcionalidades"
git push origin main

# 3. Deploy en EasyPanel (manual o automático)
# - Ve a EasyPanel
# - Click en "Deploy"
# - Monitorea logs

# 4. Post-deploy check
./scripts/post-deploy-check.sh https://tu-dominio.com

# 5. Si pasa, ¡listo! 🎉
```

---

### Deploy con Problemas

```bash
# 1. Pre-deploy check
./scripts/pre-deploy-check.sh
# ❌ FALLÓ

# 2. Revisar errores
# - Lee los mensajes de error en consola
# - Corrige los problemas

# 3. Volver a verificar
./scripts/pre-deploy-check.sh
# ✅ AHORA PASA

# 4. Continuar con deploy...
```

---

### Rollback de Emergencia

```bash
# 1. Algo salió muy mal en producción
./scripts/emergency-rollback.sh

# 2. Confirmar rollback
# Escribe: SI

# 3. Verificar código restaurado
git status
./scripts/pre-deploy-check.sh

# 4. Redeploy en EasyPanel
# - Ve a EasyPanel
# - Click en "Redeploy"
```

---

## 🔧 Mantenimiento de Scripts

### Hacer Scripts Ejecutables

Si los scripts pierden permisos de ejecución:

```bash
chmod +x /home/ubuntu/escalafin_mvp/scripts/*.sh
```

### Verificar Permisos

```bash
ls -lh /home/ubuntu/escalafin_mvp/scripts/*.sh
```

Deberías ver `-rwxr-xr-x` al inicio de cada línea.

---

## 📚 Documentación Relacionada

- **ESTRATEGIA_DEPLOY_EASYPANEL.md** - Estrategia completa de deploy
- **CHECKLIST_DEPLOY_EASYPANEL.md** - Checklist visual rápido
- **FIX_NPM_CI_LOCKFILEVERSION.md** - Fix error npm ci
- **MULTI_INSTANCE_GUIDE.md** - Deploy multi-instancia

---

## 🐛 Troubleshooting

### Script no se ejecuta

```bash
# Verificar permisos
ls -l scripts/pre-deploy-check.sh

# Si no es ejecutable
chmod +x scripts/pre-deploy-check.sh

# Ejecutar de nuevo
./scripts/pre-deploy-check.sh
```

### Script muestra errores de sintaxis

```bash
# Verificar fin de línea (debe ser LF, no CRLF)
file scripts/pre-deploy-check.sh

# Si muestra CRLF, convertir a LF
dos2unix scripts/pre-deploy-check.sh
```

### Script no encuentra archivos

```bash
# Asegúrate de estar en el directorio correcto
cd /home/ubuntu/escalafin_mvp

# Luego ejecuta
./scripts/pre-deploy-check.sh
```

---

## ✅ Resumen

| Script | Cuándo Usar | Duración |
|--------|-------------|----------|
| `pre-deploy-check.sh` | Antes de CADA deploy | ~10s |
| `post-deploy-check.sh` | Después de CADA deploy | ~15s |
| `emergency-rollback.sh` | Solo si todo falla | ~30s |

---

**Última actualización:** 16 de octubre de 2025  
**Mantenido por:** Equipo EscalaFin
