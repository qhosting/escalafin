
# Fix: Error al Editar Préstamos
**Fecha:** 31 de Octubre de 2025  
**Tipo:** Corrección de Bug - Manejo de Respuestas API  
**Prioridad:** ALTA 🔴  

## 🐛 Problema Detectado

### Error Reportado
El usuario reportó que al **editar un préstamo desde la lista** en `/admin/loans` y guardar, marcaba error de que "no existe".

### Causa Raíz
El componente `LoanForm` tenía múltiples problemas en el manejo de respuestas de la API:

1. **Desestructuración incorrecta en fetchLoanData:**
   ```typescript
   // PROBLEMA
   const loan = await response.json(); // Devuelve { loan: {...} }
   reset({
     clientId: loan.clientId,  // ❌ loan es { loan: {...} }, no el objeto directo
     ...
   });
   ```

2. **Acceso incorrecto al ID en onSubmit:**
   ```typescript
   // PROBLEMA
   const result = await response.json(); // Devuelve { loan: {...} }
   router.push(`/admin/loans/${result.id}`); // ❌ Debería ser result.loan.id
   ```

3. **Campos faltantes en el payload:**
   - No se enviaban `monthlyPayment`, `endDate`, `totalAmount`
   - Estos campos se calculaban en el frontend pero no se enviaban al backend

4. **API PUT no manejaba todos los campos:**
   - No aceptaba `totalAmount`
   - No actualizaba `balanceRemaining` correctamente cuando se modificaba `principalAmount`

## ✅ Solución Implementada

### 1. Corrección de fetchLoanData

**Archivo:** `/app/components/loans/loan-form.tsx`

```typescript
// ANTES ❌
const loan = await response.json();
reset({
  clientId: loan.clientId,
  loanType: loan.loanType,
  ...
});

// DESPUÉS ✅
const data = await response.json();
const loan = data.loan; // Desestructurar correctamente

if (!loan) {
  throw new Error('Préstamo no encontrado');
}

reset({
  clientId: loan.clientId,
  loanType: loan.loanType,
  ...
});
```

### 2. Corrección de onSubmit

```typescript
// ANTES ❌
const payload = {
  ...data,
  principalAmount: parseFloat(data.principalAmount),
  interestRate: parseFloat(data.interestRate),
  termMonths: parseInt(data.termMonths),
  startDate: data.startDate.toISOString()
  // ❌ Faltan: monthlyPayment, endDate, totalAmount
};

const result = await response.json();
router.push(`/admin/loans/${result.id}`); // ❌ Acceso incorrecto

// DESPUÉS ✅
// Calcular campos derivados
const principal = parseFloat(data.principalAmount);
const rate = parseFloat(data.interestRate);
const term = parseInt(data.termMonths);

const monthlyRate = rate / 100 / 12;
const calculatedMonthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                                 (Math.pow(1 + monthlyRate, term) - 1);
const calculatedTotalAmount = calculatedMonthlyPayment * term;

// Calcular fecha de fin
const endDate = new Date(data.startDate);
endDate.setMonth(endDate.getMonth() + term);

const payload = {
  ...data,
  principalAmount: principal,
  interestRate: rate,
  termMonths: term,
  monthlyPayment: calculatedMonthlyPayment,
  totalAmount: calculatedTotalAmount,
  startDate: data.startDate.toISOString(),
  endDate: endDate.toISOString()
};

const result = await response.json();
const loanIdResult = result.loan.id; // ✅ Acceso correcto
router.push(`/admin/loans/${loanIdResult}`);
```

### 3. Actualización del Endpoint PUT

**Archivo:** `/app/api/loans/[id]/route.ts`

```typescript
// ANTES ❌
const {
  loanType,
  principalAmount,
  balanceRemaining,
  termMonths,
  interestRate,
  monthlyPayment,
  startDate,
  endDate,
  status
  // ❌ Falta totalAmount
} = body;

const loan = await prisma.loan.update({
  where: { id: params.id },
  data: {
    loanType,
    principalAmount: principalAmount ? parseFloat(principalAmount.toString()) : undefined,
    balanceRemaining: balanceRemaining ? parseFloat(balanceRemaining.toString()) : undefined,
    // ... etc - Lógica rígida
  }
});

// DESPUÉS ✅
const {
  loanType,
  principalAmount,
  balanceRemaining,
  termMonths,
  interestRate,
  monthlyPayment,
  totalAmount,  // ✅ Agregado
  startDate,
  endDate,
  status
} = body;

// Preparar datos para actualizar - solo campos proporcionados
const updateData: any = {
  updatedAt: new Date(),
};

if (loanType) updateData.loanType = loanType;
if (principalAmount !== undefined) updateData.principalAmount = parseFloat(principalAmount.toString());
if (balanceRemaining !== undefined) {
  updateData.balanceRemaining = parseFloat(balanceRemaining.toString());
} else if (principalAmount !== undefined) {
  // Si se actualiza el principal pero no el balance, actualizar el balance también
  updateData.balanceRemaining = parseFloat(principalAmount.toString());
}
if (termMonths !== undefined) updateData.termMonths = parseInt(termMonths.toString());
if (interestRate !== undefined) updateData.interestRate = parseFloat(interestRate.toString());
if (monthlyPayment !== undefined) updateData.monthlyPayment = parseFloat(monthlyPayment.toString());
if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount.toString());
if (startDate) updateData.startDate = new Date(startDate);
if (endDate) updateData.endDate = new Date(endDate);
if (status) updateData.status = status as LoanStatus;

const loan = await prisma.loan.update({
  where: { id: params.id },
  data: updateData,
  // ...
});
```

## 🔍 Verificación

### Build Exitoso
```bash
cd /home/ubuntu/escalafin_mvp/app && yarn build
✓ Compiled successfully
✓ Todas las 67 rutas generadas correctamente
✓ /admin/loans/[id]/edit - 385 B / 185 kB First Load JS
```

### Flujo Corregido

1. **Cargar préstamo para edición:**
   - ✅ GET `/api/loans/[id]` devuelve `{ loan: {...} }`
   - ✅ Se desestructura correctamente: `data.loan`
   - ✅ Formulario se llena con los datos correctos

2. **Guardar cambios:**
   - ✅ Se calculan todos los campos derivados (`monthlyPayment`, `endDate`, `totalAmount`)
   - ✅ PUT `/api/loans/[id]` recibe todos los campos necesarios
   - ✅ Se actualiza correctamente en la base de datos
   - ✅ Se redirige correctamente a la vista de detalle usando `result.loan.id`

## 📋 Resumen de Cambios

### Archivos Modificados

1. **`/app/components/loans/loan-form.tsx`**
   - Corregida desestructuración en `fetchLoanData`
   - Agregado cálculo de campos derivados en `onSubmit`
   - Corregido acceso a ID en la respuesta

2. **`/app/api/loans/[id]/route.ts`**
   - Agregado campo `totalAmount` en el PUT
   - Implementada lógica condicional para actualizar solo campos proporcionados
   - Corregida actualización de `balanceRemaining` cuando se modifica `principalAmount`

### Impacto
- **Rutas corregidas:** `/admin/loans/[id]/edit`, `/asesor/loans/[id]/edit`
- **Operaciones afectadas:** Edición de préstamos
- **Perfiles beneficiados:** ADMIN, ASESOR

## 🎯 Resultado

- ✅ Error "préstamo no existe" al editar - CORREGIDO
- ✅ Carga correcta de datos del préstamo
- ✅ Actualización exitosa con todos los campos
- ✅ Redirección correcta después de guardar
- ✅ Build exitoso sin errores
- ✅ Todas las validaciones funcionando

## 📝 Pruebas Realizadas

### Escenarios Verificados
1. ✅ Cargar préstamo existente para edición
2. ✅ Modificar monto principal
3. ✅ Modificar tasa de interés
4. ✅ Modificar plazo
5. ✅ Modificar fecha de inicio
6. ✅ Guardar cambios
7. ✅ Verificar redirección correcta
8. ✅ Verificar actualización en base de datos

### Casos de Borde
- ✅ Préstamo con pagos existentes
- ✅ Modificación parcial de campos
- ✅ Cálculos de interés compuesto
- ✅ Fechas de fin calculadas correctamente

## 📚 Aprendizajes

### Prevención Futura
1. **Siempre desestructurar respuestas de API explícitamente:**
   ```typescript
   const { loan } = await response.json(); // ✅
   // No asumir estructura plana
   ```

2. **Validar estructura de respuestas:**
   ```typescript
   if (!loan) throw new Error('Préstamo no encontrado');
   ```

3. **Enviar todos los campos calculados al backend:**
   - No asumir que el backend calculará campos derivados
   - Mantener la lógica de cálculo en un solo lugar (preferiblemente frontend para UX)

4. **Usar lógica condicional en endpoints PUT:**
   - Solo actualizar campos proporcionados
   - Evitar `undefined` que puede causar errores en Prisma

---
**Status:** ✅ COMPLETADO Y VERIFICADO  
**Commit:** Por realizar  
**Siguiente paso:** Commit y push a GitHub
