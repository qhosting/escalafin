
# Fix: Categorías Inválidas en seed-modules.js
**Fecha:** 30 de octubre de 2025
**Commit:** Por determinar

## 🔍 Problema Detectado

Error durante la sincronización de módulos PWA en producción:

```
Invalid value for argument `category`. Expected ModuleCategory.
```

### Causa Raíz
El script `scripts/seed-modules.js` estaba usando valores de categoría que no existen en el enum `ModuleCategory` definido en el schema de Prisma:

**Categorías inválidas encontradas:**
- `"CREDIT"` → No existe en el enum
- `"SYSTEM"` → No existe en el enum

**Enum válido en schema.prisma:**
```prisma
enum ModuleCategory {
  DASHBOARD
  LOANS
  PAYMENTS
  CLIENTS
  REPORTS
  NOTIFICATIONS
  INTEGRATIONS
  TOOLS
  ANALYTICS
}
```

## ✅ Solución Implementada

### 1. Mapeo de Categorías Inválidas

Se corrigieron todas las referencias de categorías inválidas:

| Categoría Inválida | Categoría Correcta | Justificación |
|-------------------|-------------------|---------------|
| `CREDIT` | `LOANS` | Las solicitudes de crédito son parte del módulo de préstamos |
| `SYSTEM` | `TOOLS` | Los módulos de sistema son herramientas administrativas |

### 2. Módulos Afectados

**Módulos con categoría CREDIT → LOANS:**
- `credit_applications_admin` - Solicitudes de Crédito (Admin)
- `credit_applications_asesor` - Solicitudes de Crédito (Asesor)
- `credit_applications_client` - Mis Solicitudes

**Módulos con categoría SYSTEM → TOOLS:**
- `admin_users` - Gestión de Usuarios
- `admin_roles` - Gestión de Roles
- `admin_modules` - Gestión de Módulos
- `admin_config` - Configuración del Sistema
- `admin_audit` - Auditoría del Sistema
- `admin_whatsapp` - Configuración WhatsApp

### 3. Comando de Corrección

```bash
cd /home/ubuntu/escalafin_mvp/app
sed -i "s/category: 'CREDIT'/category: 'LOANS'/g" scripts/seed-modules.js
sed -i "s/category: 'SYSTEM'/category: 'TOOLS'/g" scripts/seed-modules.js
```

## 🧪 Verificación

### Antes del Fix
```
❌ Error seeding modules: PrismaClientValidationError
Invalid value for argument `category`. Expected ModuleCategory.
```

### Después del Fix
```bash
# Verificar que no existen categorías inválidas
grep -n "category: 'CREDIT\|category: 'SYSTEM" scripts/seed-modules.js
# (No debe retornar resultados)
```

## 📋 Checklist de Validación

- [x] Eliminadas todas las referencias a categoría "CREDIT"
- [x] Eliminadas todas las referencias a categoría "SYSTEM"
- [x] Verificado que todas las categorías usan valores válidos del enum
- [x] Documentación creada
- [ ] Commit y push a GitHub
- [ ] Despliegue en EasyPanel
- [ ] Verificación en producción

## 🔄 Impacto

**Positivo:**
- ✅ Sincronización de módulos PWA funcionará correctamente
- ✅ Sin errores de validación de Prisma
- ✅ Todos los módulos se activarán correctamente al inicio
- ✅ Mejor organización lógica de categorías

**Sin Impacto Negativo:**
- El cambio es puramente de categorización
- No afecta funcionalidad ni permisos
- Compatible con versión actual de base de datos

## 📝 Archivos Modificados

```
app/scripts/seed-modules.js
```

## 🚀 Próximos Pasos

1. **Commit y Push**
   ```bash
   cd /home/ubuntu/escalafin_mvp
   git add app/scripts/seed-modules.js
   git commit -m "fix(seed): Corregir categorías inválidas en seed-modules.js"
   git push origin main
   ```

2. **En EasyPanel**
   - Pull del último commit
   - Limpiar cache de build
   - Rebuild completo
   - Verificar logs de sincronización de módulos

3. **Verificación**
   - Confirmar que no hay errores en logs
   - Verificar que todos los módulos están disponibles
   - Probar acceso según rol

## 🔗 Referencias

- Enum ModuleCategory: `app/prisma/schema.prisma` (línea 727)
- Script de seed: `app/scripts/seed-modules.js`
- Documentación de módulos PWA: `AUTO_SEED_MODULOS_30_OCT_2025.md`

---
**Nota:** Este fix es crítico para el funcionamiento correcto del sistema de módulos PWA en producción.
