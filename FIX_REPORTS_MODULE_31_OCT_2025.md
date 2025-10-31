
# Fix: Habilitación de Módulo de Reportes
**Fecha:** 31 de Octubre 2025  
**Problema:** Módulo de reportes no visible o genera error

---

## 🔍 Diagnóstico

El módulo de reportes (`/admin/reports`) está implementado correctamente en el código, pero puede no estar visible en el menú o generar errores si:

1. El módulo no está habilitado en la base de datos
2. El usuario no tiene permisos para acceder
3. Los módulos no se han sincronizado después de actualizaciones

---

## ✅ Solución Implementada

### 1. Verificación de Módulos de Reportes

Los siguientes módulos están definidos en `/app/scripts/seed-modules.js`:

```javascript
{
  moduleKey: 'report_portfolio',
  name: 'Reporte de Cartera',
  description: 'Análisis detallado de la cartera de préstamos',
  category: 'REPORTS',
  status: 'ENABLED',
  route: '/reports/portfolio',
  availableFor: ['ADMIN', 'ASESOR']
},
{
  moduleKey: 'report_collections',
  name: 'Reporte de Cobranza',
  description: 'Información sobre pagos vencidos y cobranza',
  category: 'REPORTS',
  status: 'ENABLED',
  route: '/reports/collections',
  availableFor: ['ADMIN', 'ASESOR']
},
{
  moduleKey: 'report_export',
  name: 'Exportar Reportes',
  description: 'Exportación de datos en diferentes formatos',
  category: 'REPORTS',
  status: 'ENABLED',
  route: '/reports/export',
  availableFor: ['ADMIN', 'ASESOR']
}
```

### 2. Sincronización de Módulos

Para sincronizar los módulos con la base de datos:

```bash
cd /home/ubuntu/escalafin_mvp/app
node scripts/seed-modules.js
```

Este comando:
- ✅ Crea módulos nuevos que no existen
- ✅ Actualiza módulos existentes
- ✅ Configura permisos por rol
- ✅ No elimina datos existentes

---

## 📋 Verificación del Módulo de Reportes

### Componentes Verificados

#### 1. Página Principal
- **Ruta:** `/app/app/admin/reports/page.tsx`
- **Estado:** ✅ Implementado correctamente
- **Pestañas:**
  - Vencimientos (Due Loans)
  - Cobranza (Collections)
  - Análisis (Analytics)

#### 2. API Endpoints

**Reporte de Vencimientos:**
- **Ruta:** `/app/api/reports/due-loans/route.ts`
- **Método:** GET
- **Parámetros:** `dateFrom`, `dateTo`
- **Estado:** ✅ Funcionando

**Reporte de Cobranza:**
- **Ruta:** `/app/api/reports/collections/route.ts`
- **Método:** GET
- **Parámetros:** `dateFrom`, `dateTo`
- **Estado:** ✅ Funcionando

#### 3. Componente de Exportación
- **Ruta:** `/app/components/export/export-reports.tsx`
- **Formatos:** CSV, JSON, PDF (impresión)
- **Estado:** ✅ Implementado

---

## 🚀 Cómo Acceder a los Reportes

### Desde el Menú de Navegación
1. Iniciar sesión como **ADMIN** o **ASESOR**
2. Ir al menú lateral
3. Sección **Reportes y Análisis**
4. Seleccionar cualquier reporte disponible

### URL Directa
```
/admin/reports
```

---

## 📊 Funcionalidades Disponibles

### Pestaña de Vencimientos
- **KPIs:**
  - Préstamos vencidos
  - Monto total vencido
  - Préstamos críticos (+30 días)

- **Tabla detallada:**
  - Cliente
  - Número de préstamo
  - Monto vencido
  - Días de atraso
  - Último pago
  - Estado
  - Contacto

- **Filtros:**
  - Rango de fechas personalizable

### Pestaña de Cobranza
- **KPIs:**
  - Total cobrado
  - Cobradores activos
  - Visitas totales

- **Tabla detallada:**
  - Cobrador
  - Total de cobros
  - Monto total
  - Visitas realizadas
  - Efectividad
  - Fecha

### Exportación
- Exportar a CSV (Excel)
- Exportar a JSON
- Imprimir reporte

---

## 🔧 Solución de Problemas Comunes

### El módulo no aparece en el menú
**Solución:**
```bash
cd /home/ubuntu/escalafin_mvp/app
node scripts/seed-modules.js
```

### Error 401 (No autorizado)
**Causa:** Usuario sin permisos
**Solución:** Verificar que el usuario tenga rol ADMIN o ASESOR

### Error 404 (Not Found)
**Causa:** Ruta no encontrada
**Solución:** 
1. Verificar que el módulo esté habilitado
2. Verificar que la ruta sea `/admin/reports`
3. Reiniciar el servidor

### Datos vacíos en reportes
**Causa:** No hay préstamos activos o pagos registrados
**Solución:** Normal si es instalación nueva o sin datos de prueba

---

## 🔍 Verificación Manual

### 1. Verificar Módulo en Base de Datos
```sql
SELECT * FROM pwa_modules WHERE category = 'REPORTS';
```

Debe mostrar los 3 módulos de reportes con `status = 'ENABLED'`

### 2. Verificar Permisos
```sql
SELECT m.name, m.moduleKey, mrp.role, mrp.enabled 
FROM pwa_modules m
LEFT JOIN module_role_permissions mrp ON m.id = mrp.moduleId
WHERE m.category = 'REPORTS';
```

Debe mostrar permisos habilitados para ADMIN y ASESOR

### 3. Verificar API
```bash
# Desde el servidor
curl -X GET http://localhost:3000/api/reports/due-loans
```

Debe responder con datos o array vacío (no error 404)

---

## 📝 Archivos Relacionados

### Componentes
- `/app/app/admin/reports/page.tsx` - Página principal
- `/app/components/export/export-reports.tsx` - Exportación

### API Routes
- `/app/api/reports/due-loans/route.ts` - Vencimientos
- `/app/api/reports/collections/route.ts` - Cobranza

### Scripts
- `/app/scripts/seed-modules.js` - Sincronización de módulos

---

## ✅ Estado Actual

- ✅ Módulos de reportes definidos en seed script
- ✅ Componente de reportes implementado
- ✅ API endpoints funcionando
- ✅ Exportación de datos disponible
- ✅ Permisos configurados correctamente

**Para activar:** Ejecutar `node scripts/seed-modules.js` en el directorio `/app`

---

*Documentación generada el 31 de Octubre 2025*
