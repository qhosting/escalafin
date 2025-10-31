# Fix: Error al Crear Clientes - Foreign Key Constraint Violated

## Problema

Error al crear clientes desde `/admin/clients/new`:

```
Foreign key constraint violated on the constraint: `clients_asesorId_fkey`
```

### Causa Raíz

El formulario de creación de clientes estaba enviando `asesorId` como un **string vacío** (`""`), y la API intentaba crear el cliente con ese valor vacío sin validación, causando una violación de restricción de clave foránea en Prisma.

### Flujo del Error

1. Formulario inicializa `asesorId: ''` (string vacío)
2. Usuario no selecciona un asesor
3. Se envía el formulario con `asesorId: ""`
4. API intenta crear cliente con `asesorId: ""`
5. Prisma arroja error de clave foránea (no existe usuario con ID `""`)

## Solución Implementada

### Cambios en `/api/clients/route.ts`

Se agregó validación completa para el campo `asesorId`:

```typescript
// Set asesorId - validate and handle empty strings
if (session.user.role === UserRole.ADMIN) {
  // Only set asesorId if provided and not empty
  if (asesorId && asesorId.trim() !== '') {
    // Verify the asesor exists and has ASESOR role
    const asesorExists = await prisma.user.findFirst({
      where: {
        id: asesorId,
        role: UserRole.ASESOR,
        status: 'ACTIVE'
      }
    });

    if (!asesorExists) {
      return NextResponse.json(
        { error: 'El asesor seleccionado no existe o no está activo' },
        { status: 400 }
      );
    }

    clientData.asesorId = asesorId;
  }
  // If no asesorId provided or empty, leave it as undefined (will be null in DB)
} else if (session.user.role === UserRole.ASESOR) {
  // Asesores always assign clients to themselves
  clientData.asesorId = session.user.id;
}
```

### Cambios en `/app/api/clients/route.ts`

Se aplicó la misma validación en la versión alternativa del endpoint:

```typescript
// Set asesorId - validate and handle empty strings
let finalAsesorId: string | undefined = undefined;

if (user.role === 'ASESOR') {
  // Asesores always assign clients to themselves
  finalAsesorId = user.id;
} else if (user.role === 'ADMIN') {
  // Only set asesorId if provided and not empty
  if (asesorId && asesorId.trim() !== '') {
    // Verify the asesor exists and has ASESOR role
    const asesorExists = await prisma.user.findFirst({
      where: {
        id: asesorId,
        role: 'ASESOR',
        status: 'ACTIVE'
      }
    });

    if (!asesorExists) {
      return NextResponse.json(
        { error: 'El asesor seleccionado no existe o no está activo' },
        { status: 400 }
      );
    }

    finalAsesorId = asesorId;
  }
  // If no asesorId provided or empty, leave it as undefined (will be null in DB)
}
```

## Validaciones Agregadas

### 1. Validación de String Vacío
- Verifica que `asesorId` no sea `null`, `undefined`, o string vacío
- Usa `.trim()` para eliminar espacios en blanco

### 2. Validación de Existencia
- Verifica que el usuario existe en la base de datos
- Confirma que tiene el rol `ASESOR`
- Verifica que está `ACTIVE`

### 3. Manejo de Casos por Rol

#### ADMIN:
- Puede crear clientes sin asignar asesor (campo queda como `null`)
- Puede asignar un asesor válido
- Si intenta asignar un asesor inválido, recibe error descriptivo

#### ASESOR:
- Siempre se asigna a sí mismo automáticamente
- No puede crear clientes sin asesor asignado

## Comportamiento Esperado

### Caso 1: Admin crea cliente sin asesor
- `asesorId` se deja vacío en el formulario
- API crea el cliente con `asesorId: null`
- ✅ Cliente creado exitosamente sin asesor asignado

### Caso 2: Admin crea cliente con asesor válido
- `asesorId` contiene ID válido de un ASESOR
- API valida que el asesor existe y está activo
- ✅ Cliente creado con asesor asignado

### Caso 3: Admin intenta asignar asesor inválido
- `asesorId` contiene ID que no existe o no es ASESOR
- API retorna error: "El asesor seleccionado no existe o no está activo"
- ❌ Cliente no se crea

### Caso 4: Asesor crea cliente
- `asesorId` se asigna automáticamente al ID del asesor actual
- API ignora cualquier valor enviado en `asesorId`
- ✅ Cliente creado con el asesor actual asignado

## Archivos Modificados

1. `/api/clients/route.ts` - Endpoint principal de creación de clientes
2. `/app/api/clients/route.ts` - Versión alternativa del endpoint

## Testing

Para probar el fix:

1. **Como ADMIN - sin asesor:**
   ```bash
   curl -X POST https://escalafin.com/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Juan",
       "lastName": "Pérez",
       "phone": "1234567890",
       "asesorId": ""
     }'
   ```
   Resultado esperado: Cliente creado con `asesorId: null`

2. **Como ADMIN - con asesor válido:**
   ```bash
   curl -X POST https://escalafin.com/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "María",
       "lastName": "García",
       "phone": "0987654321",
       "asesorId": "clxxxxx_valid_asesor_id"
     }'
   ```
   Resultado esperado: Cliente creado con asesor asignado

3. **Como ADMIN - con asesor inválido:**
   ```bash
   curl -X POST https://escalafin.com/api/clients \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Carlos",
       "lastName": "López",
       "phone": "5555555555",
       "asesorId": "invalid_id"
     }'
   ```
   Resultado esperado: Error 400 - "El asesor seleccionado no existe o no está activo"

## Prevención de Regresión

Este fix previene:
- ✅ Violaciones de restricciones de clave foránea
- ✅ Creación de clientes con asesores inexistentes
- ✅ Asignación de clientes a usuarios que no son asesores
- ✅ Asignación de clientes a asesores inactivos

## Estado

✅ **Fix implementado y probado**
✅ **Ambos endpoints actualizados**
✅ **Validaciones completas agregadas**
✅ **Documentación creada**

---

**Fecha:** 31 de Octubre de 2025
**Tipo:** Bugfix
**Prioridad:** Alta
**Estado:** ✅ Resuelto
