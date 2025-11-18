# 🚀 Configuración Deploy EasyPanel - 18 Nov 2025

## 🎯 Problema Identificado

EasyPanel está desplegando una versión antigua del código (tag v1.1.0 del 30 Oct 2025)

**Diferencia:** 216 commits nuevos no están siendo desplegados

## 📊 Comparación de Versiones

| Versión | Commit | Fecha | Estado |
|---------|--------|-------|--------|
| v1.1.0 (actual en EasyPanel) | cb0651e | 30 Oct 2025 | ⚠️  ANTIGUO |
| v1.2.0 (nuevo) | 1787d44 | 18 Nov 2025 | ✅ ACTUAL |
| main (branch) | 1787d44 | 18 Nov 2025 | ✅ ACTUAL |

## 🆕 Features que Faltan en v1.1.0

Las siguientes funcionalidades NO están disponibles en v1.1.0:

1. ✅ **Sistema de Interés Semanal Configurable**
   - Tasas configurables por rangos de monto
   - Cálculo automático de intereses semanales

2. ✅ **Sistema de Tarifas Fijas de Préstamos**
   - Configuración de tarifas por tipo de préstamo
   - Gestión administrativa de tarifas

3. ✅ **Periodicidad de Pagos y Pago Inicial**
   - Configuración flexible de frecuencia de pagos
   - Manejo de pagos iniciales

4. ✅ **Imagen de Perfil del Cliente**
   - Upload de imágenes de perfil
   - Gestión de imágenes con almacenamiento local/cloud

5. ✅ **Migración a Debian 12 Bookworm**
   - Compatibilidad mejorada con EasyPanel
   - Mejores dependencias del sistema

6. ✅ **Fixes Críticos de Docker**
   - yarn.lock como archivo regular (no symlink)
   - schema.prisma con rutas relativas
   - Correcciones de HOME directory

7. ✅ **Migraciones de Base de Datos**
   - `add_profile_image_to_clients`
   - `add_loan_calculation_type`
   - `add_interes_semanal`

## 🔧 Solución 1: Usar Branch "main" (RECOMENDADO)

### Ventajas
- ✅ Siempre despliega la última versión automáticamente
- ✅ No requiere crear tags manualmente
- ✅ Simplifica el workflow de deployment

### Pasos en EasyPanel

1. **Ir a la configuración del proyecto**
   ```
   Projects → escalafin → Settings → Source
   ```

2. **Cambiar la configuración de branch/tag**
   - Branch: `main`
   - NO uses tag, deja el campo vacío o selecciona "Use branch"

3. **Guardar configuración**

4. **Hacer pull del repositorio**
   ```
   Projects → escalafin → Actions → Pull
   ```

5. **Clear build cache**
   ```
   Projects → escalafin → Actions → Clear Cache
   ```

6. **Rebuild**
   ```
   Projects → escalafin → Actions → Rebuild
   ```

## 🔧 Solución 2: Usar Tag v1.2.0

### Ventajas
- ✅ Versión específica y controlada
- ✅ Útil para rollbacks

### Pasos en EasyPanel

1. **Ir a la configuración del proyecto**
   ```
   Projects → escalafin → Settings → Source
   ```

2. **Cambiar la configuración de tag**
   - Tag: `v1.2.0`

3. **Guardar configuración**

4. **Hacer pull del repositorio**
   ```
   Projects → escalafin → Actions → Pull
   ```

5. **Clear build cache**
   ```
   Projects → escalafin → Actions → Clear Cache
   ```

6. **Rebuild**
   ```
   Projects → escalafin → Actions → Rebuild
   ```

## ✅ Verificación Post-Deploy

### 1. Verificar commit en logs
```bash
# En los logs de EasyPanel, busca:
Starting app with commit: 1787d44
```

### 2. Verificar features en la aplicación
- [ ] Sistema de interés semanal visible en configuración
- [ ] Tarifas fijas de préstamos disponibles
- [ ] Upload de imagen de perfil funcional
- [ ] Periodicidad de pagos configurable

### 3. Verificar migraciones aplicadas
```bash
# En los logs de startup:
Applying migration `20251112023157_add_profile_image_to_clients`
Applying migration `20251113064719_add_loan_calculation_type`
Applying migration `20251113162400_add_interes_semanal`
```

## 📝 Información de Versiones

### v1.1.0 (Actual en EasyPanel - ANTIGUO)
```
Commit: cb0651e
Fecha: 30 Oct 2025
Features: Sistema base sin features recientes
```

### v1.2.0 (Nuevo - RECOMENDADO)
```
Commit: 1787d44
Fecha: 18 Nov 2025
Features: Todas las features recientes incluidas
Commits desde v1.1.0: 216
```

## 🔄 Workflow Recomendado

### Para Deployments Futuros

**Opción A: Usando branch "main"**
1. Hacer cambios en el código
2. Commit y push a GitHub
3. En EasyPanel: Pull → Clear Cache → Rebuild
4. Listo ✅

**Opción B: Usando tags**
1. Hacer cambios en el código
2. Commit y push a GitHub
3. Crear nuevo tag: `git tag -a v1.3.0 -m "Descripción"`
4. Push tag: `git push origin v1.3.0`
5. En EasyPanel: Cambiar a nuevo tag → Pull → Clear Cache → Rebuild

## 🚨 Importante

- ⚠️  **NO uses v1.1.0** - Está desactualizado (216 commits atrás)
- ✅ **USA v1.2.0 o branch "main"** - Versiones actuales
- 🔄 **Siempre Clear Cache** - Antes de rebuild para evitar problemas

## 📋 Checklist de Deploy

- [ ] Verificar que EasyPanel NO usa v1.1.0
- [ ] Configurar branch "main" o tag "v1.2.0"
- [ ] Pull del repositorio
- [ ] Clear build cache
- [ ] Rebuild
- [ ] Verificar commit en logs (1787d44)
- [ ] Probar features nuevas
- [ ] Verificar migraciones aplicadas

## 🔗 Enlaces Útiles

- Repositorio: https://github.com/qhosting/escalafin
- Branch principal: main
- Tag actual: v1.2.0
- Último commit: 1787d44

---

**Fecha:** 18 Nov 2025  
**Preparado por:** EscalaFin Deploy System  
**Estado:** ✅ LISTO PARA DEPLOY
