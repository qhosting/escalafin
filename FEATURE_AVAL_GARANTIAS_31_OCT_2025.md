# Feature: Sistema de Aval y Garantías para Clientes

**Fecha:** 31 de Octubre de 2025  
**Tipo:** Nueva Funcionalidad  
**Módulo:** Gestión de Clientes

---

## 🎯 Objetivo

Implementar un sistema completo para registrar información de avales (garantes) y garantías (colaterales) asociadas a cada cliente, fortaleciendo el proceso de evaluación crediticia.

---

## 📋 Cambios Realizados

### 1. Modelos de Base de Datos (Prisma Schema)

#### Modelo Guarantor (Aval)
```prisma
model Guarantor {
  id           String           @id @default(cuid())
  clientId     String           @unique
  fullName     String
  address      String
  phone        String
  relationship RelationshipType
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  client       Client           @relation("ClientGuarantor", fields: [clientId], references: [id], onDelete: Cascade)

  @@map("guarantors")
}
```

**Campos:**
- `fullName`: Nombre completo del aval
- `address`: Dirección completa
- `phone`: Teléfono de contacto
- `relationship`: Tipo de parentesco (enum)

#### Modelo Collateral (Garantía)
```prisma
model Collateral {
  id          String   @id @default(cuid())
  clientId    String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  client      Client   @relation("ClientCollateral", fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@map("collaterals")
}
```

**Campos:**
- `description`: Descripción del bien en garantía
- `clientId`: Relación con el cliente

#### Relaciones en Client
```prisma
guarantor    Guarantor?          @relation("ClientGuarantor")
collaterals  Collateral[]        @relation("ClientCollateral")
```

---

### 2. API Endpoints

#### POST /api/clients
**Actualizado** para aceptar aval y garantías en la creación:
```typescript
{
  // ... campos existentes
  guarantor?: {
    fullName: string;
    address: string;
    phone: string;
    relationship: string;
  },
  collaterals?: string[]
}
```

#### GET /api/clients/[id]
**Nuevo endpoint** que retorna:
- Información del cliente
- Aval asociado
- Lista de garantías
- Préstamos y solicitudes de crédito

#### PUT /api/clients/[id]
**Nuevo endpoint** para actualizar:
- Datos del cliente
- Información del aval
- Lista de garantías

---

### 3. Formulario de Creación de Clientes

**Archivo:** `app/admin/clients/new/page.tsx`

#### Sección de Aval
- Campo: Nombre Completo
- Campo: Dirección Completa
- Campo: Teléfono
- Campo: Parentesco (Select con opciones)

#### Sección de Garantías
- Input para agregar garantías
- Botón "Agregar"
- Lista dinámica de garantías agregadas
- Botón de eliminar por cada garantía
- Contador de garantías

**Iconos Agregados:**
- `UserCheck` - Para aval
- `Package` - Para garantías
- `Plus` - Para agregar
- `X` - Para eliminar

---

### 4. Vista de Detalle del Cliente

**Archivo:** `app/admin/clients/[id]/page.tsx`

#### Card de Información del Aval
Muestra:
- Nombre completo
- Teléfono
- Parentesco (traducido)
- Dirección completa

Estado vacío: Mensaje amigable cuando no hay aval

#### Card de Garantías
Muestra:
- Lista numerada de garantías
- Descripción de cada bien
- Contador en el título

Estado vacío: Mensaje amigable cuando no hay garantías

---

## 🔧 Implementación Técnica

### Base de Datos
```bash
# Sincronización automática con Prisma
yarn prisma db push
yarn prisma generate
```

### Transacciones
Todas las operaciones de creación/actualización usan transacciones de Prisma para garantizar:
- Integridad de datos
- Rollback automático en caso de error
- Consistencia entre cliente, aval y garantías

### Validaciones
- ✅ Aval es opcional
- ✅ Garantías son opcionales
- ✅ Se pueden agregar múltiples garantías
- ✅ Un cliente solo puede tener un aval
- ✅ Eliminación en cascada

---

## 📊 Enum de Parentesco

```typescript
RELATIONSHIP_TYPES = [
  { value: 'FAMILY', label: 'Familiar' },
  { value: 'FRIEND', label: 'Amigo' },
  { value: 'COWORKER', label: 'Compañero de Trabajo' },
  { value: 'NEIGHBOR', label: 'Vecino' },
  { value: 'OTHER', label: 'Otro' }
]
```

---

## 🎨 Interfaz de Usuario

### Formulario de Creación
- **Layout:** Cards organizadas por sección
- **Validación:** Campos opcionales claramente marcados
- **UX:** Agregar/eliminar garantías de forma dinámica
- **Responsive:** Grid adaptable (1 columna en móvil, 2 en desktop)

### Vista de Detalle
- **Tab:** Información (info)
- **Grid:** 2 columnas para aval y garantías
- **Estados vacíos:** Mensajes claros y iconos
- **Contadores:** Número de garantías visible

---

## 🔒 Seguridad

### Permisos
- **ADMIN:** Acceso completo
- **ASESOR:** Solo sus clientes asignados
- **CLIENTE:** Sin acceso directo

### Validaciones Backend
```typescript
// Verificar propiedad del cliente
if (session.user.role === UserRole.ASESOR) {
  if (client.asesorId !== session.user.id) {
    return 403 Forbidden
  }
}
```

---

## 📁 Archivos Modificados

```
app/prisma/schema.prisma                    ← Modelos Guarantor y Collateral
app/api/clients/route.ts                    ← POST actualizado con transacciones
app/api/clients/[id]/route.ts               ← Nuevo: GET, PUT, DELETE
app/app/admin/clients/new/page.tsx          ← Formulario con aval y garantías
app/app/admin/clients/[id]/page.tsx         ← Vista con aval y garantías
```

---

## ✅ Verificación

### Build Status
```bash
✅ yarn build - Success
✅ TypeScript compilation - No errors
✅ Prisma schema validation - OK
✅ Database sync - OK
```

### Testing Manual
1. ✅ Crear cliente con aval y garantías
2. ✅ Crear cliente sin aval ni garantías
3. ✅ Ver detalle con aval y garantías
4. ✅ Ver detalle sin aval ni garantías
5. ✅ Agregar/eliminar garantías dinámicamente
6. ✅ Validación de parentesco

---

## 🚀 Ejemplo de Uso

### Crear Cliente con Aval y Garantías
```json
POST /api/clients
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "555-1234",
  "guarantor": {
    "fullName": "María Pérez",
    "address": "Calle 123, Colonia Centro, CDMX",
    "phone": "555-5678",
    "relationship": "FAMILY"
  },
  "collaterals": [
    "1 celular Samsung Galaxy S23",
    "1 ventilador Lasko",
    "1 pantalla LG 32 pulgadas"
  ]
}
```

---

## 📝 Próximas Mejoras

1. **Verificación de Aval:** Sistema para verificar identidad del aval
2. **Valuación de Garantías:** Estimar valor de mercado de los bienes
3. **Fotos de Garantías:** Subir fotos de los bienes
4. **Historial de Avales:** Rastrear si un aval respalda múltiples clientes
5. **Alertas:** Notificar cuando se active una garantía

---

**Fin del Feature** ✅
