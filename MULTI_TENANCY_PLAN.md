# Plan de Implementación: Multi-tenancy

Este documento detalla la estrategia para transformar la arquitectura de SystemName a una arquitectura Multi-tenant, permitiendo soportar múltiples organizaciones/empresas en una sola instancia.

## 1. Cambios en Base de Datos (Schema Prisma)

### 1.1 Nuevo Modelo `Tenant`
Crearemos un modelo central para gestionar las organizaciones.
```prisma
model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // Para subdominios: empresa.app.com
  domain      String?  @unique // Para dominios personalizados: empresa.com
  status      String   @default("ACTIVE") // ACTIVE, SUSPENDED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  users       User[]
  clients     Client[]
  // ... relacionar con otros modelos principales
}
```

### 1.2 Actualización de Modelos Existentes
Se agregará el campo `tenantId` a los modelos principales. Esto es crucial para el aislamiento de datos.

**Modelos a actualizar:**
*   `User`: Un usuario pertenecerá a un tenant.
*   `Client`: Los clientes son propiedad exclusiva de un tenant.
*   `Loan`: Préstamos asociados al tenant (indirectamente vía Client, pero recomendable directo para queries eficientes).
*   `SystemConfig`: Configuración específica por tenant.
*   `ReportTemplate`: Reportes personalizados por tenant.
*   `WahaConfig`: Configuración de WhatsApp por tenant.

**Migración de Datos Existentes:**
Todo dato existente se asignará a un "Tenant Default" (e.g., "Empresa Principal") durante la migración.

## 2. Identificación del Tenant (Middleware)

### 2.1 Estrategia de Resolución
Soportaremos dos métodos para identificar el tenant:
1.  **Subdominio**: `cliente1.sistema.com` -> Tenant: `cliente1`
2.  **Header**: `x-tenant-id` (para API calls directas o testing)

### 2.2 Middleware Next.js
Implementaremos un middleware que:
1.  Lea el Hostname o Header.
2.  Busque el Tenant en Redis/DB.
3.  Si no existe, redirija a 404 o página de registro.
4.  Inyecte el `tenantId` en los headers internos para que las API routes lo consuman.

## 3. Aislamiento de Datos (Data Access Layer)

### 3.1 Prisma Extensions / Middleware
Para evitar filtrar manualmente en *cada* query (`where: { tenantId: id }`), implementaremos una extensión de Prisma que inyecte automáticamente el filtro del tenant actual.

### 3.2 Adaptación de API Routes
Actualizar los endpoints para leer el `tenantId` del request y pasarlo a los servicios.

## 4. Plan de Trabajo

### ✅ Fase 1: Fundamentos de BD (COMPLETADA)
- [x] **Modelo `Tenant`**: Implementado con slug, dominio y estado.
- [x] **Relaciones**: Agregado `tenantId` a `User`, `Client`, `SystemConfig`, `WahaConfig`, `ReportTemplate`, `MessageTemplate`.
- [x] **Constraints**: Actualizadas llaves únicas compuestas (ej. `[key, tenantId]` en config).
- [x] **Script de Migración**: `scripts/migrate-to-multitenancy.ts` creado para asignar datos existentes al tenant default.
- [x] **Pipeline de Despliegue**: Actualizado `start.sh` para soportar migraciones automáticas.

### ✅ Fase 2: Lógica de Identificación (COMPLETADA)
El sistema ahora soporta tenants en BD, pero la aplicación no sabe cuál usar.
- [x] **Middleware de Detección**: `middleware.ts` extrae subdominio e inyecta header `x-tenant-slug`.
- [x] **Contexto de Frontend**: `TenantProvider` y `useTenant` implementados.
- [x] **Root Layout**: Actualizado para resolver tenant y proveerlo al contexto.

### 🚧 Fase 3: Aislamiento de Datos (PENDIENTE IMMEDIATE)
1.  **Prisma Client Extension**:
    *   Crear `lib/prisma-tenant.ts`.
    *   Implementar `$extends` para inyectar automáticamente `where: { tenantId }` en todas las queries.
2.  **API Routes Refactor**:
    *   Actualizar handlers para obtener `tenantId` del request (inyectado por middleware/session).
    *   Pasar `tenantId` explícitamente a servicios que lo requieran.

### ⏳ Fase 4: Administración y Onboarding (FUTURO)
1.  **Super Admin Dashboard**:
    *   Vista para crear/suspender tenants.
    *   Métricas globales.
2.  **Configuración por Tenant**:
    *   Interfaz para que cada admin de tenant configure su `SystemConfig` (logo, colores, tasas).

---

## Siguientes Pasos Inmediatos
1.  Implementar `middleware.ts` para resolución de subdominios.
2.  Probar flujo login con usuarios asignados a diferentes tenants.

