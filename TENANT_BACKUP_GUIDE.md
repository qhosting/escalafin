# 📦 Guía de Respaldos de Tenants - EscalaFin Super Admin

## 🎯 Visión General

El sistema de respaldos permite a los Super Admins exportar e importar datos completos de cualquier tenant en la plataforma. Esto es esencial para:

- **Respaldos de seguridad** antes de operaciones críticas
- **Migración de datos** entre tenants
- **Recuperación ante desastres**
- **Clonación de configuraciones** a nuevos tenants
- **Auditorías y análisis** fuera de línea

---

## 📋 ¿Qué Se Incluye en un Backup?

Cada backup exportado incluye **TODOS** los datos del tenant:

### Datos Principales
- ✅ **Usuarios** (con roles y permisos)
- ✅ **Clientes** (información personal y contacto)
- ✅ **Préstamos** (histórico completo)
- ✅ **Pagos** (transacciones y comprobantes)
- ✅ **Solicitudes de crédito**

### Configuración y Personalización
- ✅ **Configuración del sistema** (SystemConfig)
- ✅ **Templates de mensajes** (WhatsApp, SMS, Email)
- ✅ **Configuración de WAHA**
- ✅ **Templates de reportes**

### Datos Complementarios
- ✅ **Referencias personales**
- ✅ **Garantías (garantors)**
- ✅ **Colaterales**
- ✅ **Scores de crédito**

### Metadata
- 📊 **Información del tenant** (nombre, slug, plan)
- 📅 **Fecha de exportación**
- 🔢 **Versión del formato** (para compatibilidad futura)

---

## 🔽 Exportar un Backup

### Desde la Interfaz

1. **Accede a la gestión de tenants:**
   ```
   /admin/tenants
   ```

2. **Localiza el tenant** que deseas respaldar

3. **Haz clic en el menú** (⋮) de la tarjeta del tenant

4. **Selecciona "Exportar Backup"**
   - El archivo se descargará automáticamente
   - Nombre: `backup-[tenant-slug]-[fecha].json`
   - Ejemplo: `backup-acme-corp-2026-02-10.json`

5. **Guarda el archivo** en un lugar seguro

### Formato del Backup

```json
{
  "metadata": {
    "tenantId": "clxyz...",
    "tenantName": "ACME Corp",
    "tenantSlug": "acme-corp",
    "exportedAt": "2026-02-10T19:30:00.000Z",
    "exportVersion": "1.0.0"
  },
  "tenant": { /* Configuración del tenant */ },
  "users": [ /* Array de usuarios */ ],
  "clients": [ /* Array de clientes */ ],
  "loans": [ /* Array de préstamos */ ],
  "payments": [ /* Array de pagos */ ],
  // ... más datos
}
```

---

## 🔼 Importar un Backup

### ⚠️ ADVERTENCIAS IMPORTANTES

> **🚨 PELIGRO: La importación ELIMINARÁ TODOS los datos actuales del tenant**
>
> Esta operación es **DESTRUCTIVA** e **IRREVERSIBLE**. Asegúrate de:
> - Tener un backup del estado actual (si es importante)
> - Confirmar que el tenant destino es el correcto
> - Verificar que el archivo de backup es válido

### Desde la Interfaz

1. **Accede a la gestión de tenants:**
   ```
   /admin/tenants
   ```

2. **Localiza el tenant DESTINO** (donde importarás los datos)

3. **Haz clic en el menú** (⋮) de la tarjeta del tenant

4. **Selecciona "Importar Backup"**

5. **Selecciona el archivo JSON** del backup

6. **Confirma la operación peligrosa:**
   ```
   ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos actuales de "[tenant-name]" 
   y los reemplazará con el backup.
   
   ¿Estás seguro de continuar?
   ```

7. **Opción adicional:** Sobrescribir configuración del tenant
   ```
   ¿Sobrescribir también la configuración del tenant (nombre, logo, colores)?
   ```
   - **SÍ**: Restaura nombre, logo, colores del backup
   - **NO**: Mantiene la configuración actual del tenant destino

8. **Espera a que termine** la importación
   - Verás un indicador de carga
   - Al finalizar, recibirás un resumen:
     ```
     ✅ Backup importado: 150 clientes, 320 préstamos
     ```

---

## 🎯 Casos de Uso Comunes

### 1. Backup de Seguridad Antes de Cambio Mayor

**Escenario:** Vas a migrar el tenant a un nuevo plan o hacer cambios importantes.

**Pasos:**
1. Exporta el backup actual
2. Guárdalo con nombre descriptivo: `backup-pre-migracion-[fecha].json`
3. Realiza los cambios
4. Si algo sale mal, importa el backup para restaurar

---

### 2. Clonar Configuración a Nuevo Tenant

**Escenario:** Quieres crear un nuevo tenant con la misma configuración que uno existente.

**Pasos:**
1. Exporta el backup del tenant "plantilla"
2. Crea un nuevo tenant vacío
3. **Edita el backup JSON** para eliminar datos sensibles:
   - Puedes vaciar los arrays: `"clients": []`, `"loans": []`
   - Mantén: `systemConfig`, `messageTemplates`, `wahaConfig`
4. Importa al nuevo tenant con opción de sobrescribir configuración

---

### 3. Migrar Tenant Completo

**Escenario:** Necesitas mover todos los datos de un tenant a otro.

**Pasos:**
1. Exporta backup del tenant origen
2. Suspende el tenant origen (para evitar cambios durante migración)
3. Importa al tenant destino
4. Verifica que todo esté correcto
5. Si es exitoso, elimina o archiva el tenant origen

---

### 4. Recuperación ante Desastre

**Escenario:** Un tenant perdió datos por error o corrupción.

**Pasos:**
1. Localiza el backup más reciente del tenant
2. Verifica la fecha del backup en `metadata.exportedAt`
3. Importa el backup
4. Comunica al tenant qué datos se restauraron y cuáles se perdieron

---

## 🔧 Opciones Avanzadas

### Opciones de Importación

El endpoint `/api/admin/tenants/[id]/import` acepta opciones:

```typescript
{
  backup: { /* objeto de backup */ },
  options: {
    skipUsers: false,           // No importar usuarios
    skipClients: false,         // No importar clientes
    skipLoans: false,           // No importar préstamos
    skipPayments: false,        // No importar pagos
    overwriteTenantConfig: true // Sobrescribir config del tenant
  }
}
```

---

## 🚀 Uso Programático (API)

### Exportar via API

```bash
curl -X GET https://escalafin.com/api/admin/tenants/[tenant-id]/export \
  -H "Authorization: Bearer [super-admin-token]" \
  -o backup.json
```

**Respuesta:** Archivo JSON descargable

---

### Importar via API

```bash
curl -X POST https://escalafin.com/api/admin/tenants/[tenant-id]/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [super-admin-token]" \
  -d @backup.json
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Backup importado exitosamente",
  "stats": {
    "tenantName": "ACME Corp",
    "exportedAt": "2026-02-10T19:30:00.000Z",
    "counts": {
      "users": 5,
      "clients": 150,
      "loans": 320,
      "payments": 1200,
      "creditApplications": 45,
      "systemConfig": 12,
      "messageTemplates": 8,
      "wahaConfig": 2,
      "reportTemplates": 5,
      "personalReferences": 300,
      "guarantors": 50,
      "collaterals": 80,
      "creditScores": 150
    }
  }
}
```

---

## 🛡️ Seguridad y Mejores Prácticas

### ✅ DO (Hacer)

1. **Exporta backups regularmente** (semanal o mensual)
2. **Guarda múltiples versiones** de backups históricos
3. **Almacena fuera de la plataforma** (Google Drive, S3, etc.)
4. **Verifica los backups** abriendo el JSON y revisando datos
5. **Documenta las importaciones** (qué, cuándo, por qué)
6. **Prueba restauraciones** en tenants de prueba primero

### ❌ DON'T (No Hacer)

1. **No compartas backups con terceros** (contienen datos sensibles)
2. **No edites manualmente** el JSON sin conocimiento técnico
3. **No importes backups viejos** sin revisar compatibilidad de versión
4. **No olvides hacer backup** antes de operaciones destructivas
5. **No uses backups de un tenant en producción diferente** sin análisis
6. **No dejes backups** en lugares públicos o sin cifrar

---

## 🔍 Solución de Problemas

### Error: "Versión de backup no compatible"

**Causa:** El backup fue creado con una versión diferente del sistema.

**Solución:**
- Verifica `metadata.exportVersion` en el JSON
- Contacta soporte si la versión es muy antigua
- Migra datos manualmente si es necesario

---

### Error: "Target tenant not found"

**Causa:** El tenant destino no existe.

**Solución:**
- Verifica que el tenant exista en `/admin/tenants`
- Usa el ID correcto del tenant

---

### Error: "Formato de backup inválido"

**Causa:** El archivo JSON está corrupto o mal formado.

**Solución:**
- Verifica que el archivo no esté truncado
- Valida el JSON en un validador online
- Re-exporta el backup desde el origen

---

### La importación se queda "cargando"

**Causa:** Backups muy grandes pueden tardar varios minutos.

**Solución:**
- Espera al menos 5-10 minutos para backups grandes
- Revisa los logs del servidor (`docker logs escalafin-app`)
- Si falla, contacta soporte con el error del log

---

## 📊 Limitaciones Actuales

- **Tamaño máximo:** Sin límite técnico, pero backups >100MB pueden ser lentos
- **Timeout:** Importaciones >5 minutos pueden fallar (aumentar en config)
- **Archivos adjuntos:** NO se incluyen (solo referencias en BD)
- **Imágenes/documentos:** NO se exportan (solo URLs)
- **Versiones:** Solo soporta versión 1.0.0 actualmente

---

## 🗓️ Roadmap Futuro

- [ ] Backups incrementales (solo cambios)
- [ ] Programación automática de backups
- [ ] Compresión (ZIP/GZIP) de backups
- [ ] Exportación selectiva (solo clientes, solo config, etc.)
- [ ] Importación sin destruir datos (merge inteligente)
- [ ] Cifrado de backups con contraseña
- [ ] Almacenamiento en la nube integrado (S3, Drive)
- [ ] Logs de auditoría de exportaciones/importaciones

---

## 📞 Soporte

Si encuentras problemas con los backups:

1. **Revisa esta guía** primero
2. **Consulta los logs** del sistema (`docker logs escalafin-app`)
3. **Contacta al equipo técnico** con:
   - ID del tenant
   - Archivo de backup (si aplica)
   - Mensaje de error completo
   - Timestamp del evento

---

**Última actualización:** Febrero 10, 2026  
**Versión de la guía:** 1.0.0
