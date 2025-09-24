
# EscalaFin - Estructura de Base de Datos

## Esquema Completo de la Base de Datos

### Tabla: `users` 
Usuarios del sistema con autenticación
```sql
- id: String (PK, CUID)
- email: String (UNIQUE)
- password: String (Hasheada con bcrypt)
- firstName: String
- lastName: String
- phone: String (opcional)
- role: UserRole (ADMIN, ASESOR, CLIENTE)
- status: UserStatus (ACTIVE, INACTIVE, SUSPENDED)
- createdAt: DateTime
- updatedAt: DateTime
- emailVerified: DateTime (opcional)
```

### Tabla: `clients`
Información completa de clientes (CRM)
```sql
- id: String (PK, CUID)
- userId: String (UNIQUE, FK opcional)
- firstName: String
- lastName: String
- email: String (UNIQUE, opcional)
- phone: String
- dateOfBirth: DateTime (opcional)
- address: String (opcional)
- city: String (opcional)
- state: String (opcional)
- postalCode: String (opcional)

-- Información Financiera
- monthlyIncome: Decimal(12,2) (opcional)
- employmentType: EmploymentType (opcional)
- employerName: String (opcional)
- workAddress: String (opcional)
- yearsEmployed: Int (opcional)
- creditScore: Int (opcional)
- bankName: String (opcional)
- accountNumber: String (opcional)

-- Estado y Asignación
- status: ClientStatus (ACTIVE, INACTIVE, BLACKLISTED)
- asesorId: String (FK opcional)
- createdAt: DateTime
- updatedAt: DateTime
```

### Tabla: `credit_applications`
Solicitudes de crédito con workflow
```sql
- id: String (PK, CUID)
- clientId: String (FK)
- asesorId: String (FK)
- loanType: LoanType (PERSONAL, BUSINESS, MORTGAGE, AUTO, EDUCATION)
- requestedAmount: Decimal(12,2)
- requestedTerm: Int (meses)
- purpose: String
- status: ApplicationStatus (PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED)

-- Información de Revisión
- reviewedBy: String (FK opcional)
- reviewedAt: DateTime (opcional)
- reviewComments: String (opcional)
- approvedAmount: Decimal(12,2) (opcional)
- approvedTerm: Int (opcional)
- interestRate: Decimal(5,4) (opcional)

- createdAt: DateTime
- updatedAt: DateTime
```

### Tabla: `loans`
Préstamos activos
```sql
- id: String (PK, CUID)
- clientId: String (FK)
- creditApplicationId: String (FK UNIQUE, opcional)
- loanNumber: String (UNIQUE)
- loanType: LoanType
- principalAmount: Decimal(12,2)
- interestRate: Decimal(5,4)
- termMonths: Int
- monthlyPayment: Decimal(12,2)
- totalAmount: Decimal(12,2)
- balanceRemaining: Decimal(12,2)
- status: LoanStatus (ACTIVE, PAID_OFF, DEFAULTED, CANCELLED)
- startDate: DateTime
- endDate: DateTime
- createdAt: DateTime
- updatedAt: DateTime
```

### Tabla: `amortization_schedule`
Tabla de amortización detallada
```sql
- id: String (PK, CUID)
- loanId: String (FK)
- paymentNumber: Int
- paymentDate: DateTime
- principalPayment: Decimal(12,2)
- interestPayment: Decimal(12,2)
- totalPayment: Decimal(12,2)
- remainingBalance: Decimal(12,2)
- isPaid: Boolean (default: false)

-- Constraint: UNIQUE(loanId, paymentNumber)
```

### Tabla: `payments`
Historial de pagos realizados
```sql
- id: String (PK, CUID)
- loanId: String (FK)
- amortizationScheduleId: String (FK UNIQUE, opcional)
- amount: Decimal(12,2)
- paymentDate: DateTime
- paymentMethod: PaymentMethod (CASH, BANK_TRANSFER, CHECK, DEBIT_CARD, CREDIT_CARD, ONLINE)
- status: PaymentStatus (PENDING, COMPLETED, FAILED, CANCELLED)
- reference: String (opcional)
- notes: String (opcional)
- processedBy: String (FK opcional)
- createdAt: DateTime
- updatedAt: DateTime
```

## Enumeraciones (ENUMs)

### UserRole
```sql
ADMIN     -- Administrador del sistema
ASESOR    -- Asesor de crédito
CLIENTE   -- Cliente final
```

### UserStatus
```sql
ACTIVE     -- Usuario activo
INACTIVE   -- Usuario inactivo
SUSPENDED  -- Usuario suspendido
```

### ClientStatus
```sql
ACTIVE      -- Cliente activo
INACTIVE    -- Cliente inactivo
BLACKLISTED -- Cliente en lista negra
```

### EmploymentType
```sql
EMPLOYED      -- Empleado
SELF_EMPLOYED -- Independiente
UNEMPLOYED    -- Desempleado
RETIRED       -- Jubilado
STUDENT       -- Estudiante
```

### ApplicationStatus
```sql
PENDING      -- Solicitud pendiente
UNDER_REVIEW -- En revisión
APPROVED     -- Aprobada
REJECTED     -- Rechazada
CANCELLED    -- Cancelada
```

### LoanType
```sql
PERSONAL   -- Préstamo personal
BUSINESS   -- Préstamo empresarial
MORTGAGE   -- Préstamo hipotecario
AUTO       -- Préstamo automotriz
EDUCATION  -- Préstamo educativo
```

### LoanStatus
```sql
ACTIVE    -- Préstamo activo
PAID_OFF  -- Préstamo liquidado
DEFAULTED -- Préstamo en mora
CANCELLED -- Préstamo cancelado
```

### PaymentStatus
```sql
PENDING   -- Pago pendiente
COMPLETED -- Pago completado
FAILED    -- Pago fallido
CANCELLED -- Pago cancelado
```

### PaymentMethod
```sql
CASH         -- Efectivo
BANK_TRANSFER -- Transferencia bancaria
CHECK        -- Cheque
DEBIT_CARD   -- Tarjeta de débito
CREDIT_CARD  -- Tarjeta de crédito
ONLINE       -- Pago en línea
```

## Relaciones Principales

### Usuarios y Clientes
- Un usuario puede tener un perfil de cliente (1:1 opcional)
- Un asesor puede tener múltiples clientes asignados (1:N)

### Solicitudes de Crédito
- Un cliente puede tener múltiples solicitudes (1:N)
- Un asesor crea múltiples solicitudes (1:N)
- Un admin revisa múltiples solicitudes (1:N)
- Una solicitud puede generar un préstamo (1:1 opcional)

### Préstamos y Amortización
- Un préstamo tiene múltiples pagos programados (1:N)
- Un préstamo pertenece a un cliente (N:1)
- Cada pago programado puede tener un pago real (1:1 opcional)

### Pagos
- Múltiples pagos pertenecen a un préstamo (N:1)
- Un pago puede estar asociado a un pago programado (N:1 opcional)
- Un usuario procesa múltiples pagos (1:N opcional)

## Índices Recomendados

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_asesor ON clients(asesorId);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_loans_client ON loans(clientId);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_payments_loan ON payments(loanId);
CREATE INDEX idx_payments_date ON payments(paymentDate);
CREATE INDEX idx_applications_status ON credit_applications(status);
CREATE INDEX idx_amortization_loan ON amortization_schedule(loanId);
```

## Datos de Prueba Incluidos

El sistema incluye un seed script que crea:
- **7 usuarios** con diferentes roles
- **5 perfiles de cliente** completos
- **3 solicitudes de crédito** en varios estados
- **3 préstamos activos** con diferentes tipos
- **60 registros de amortización** calculados automáticamente
- **7 pagos realizados** con referencias

---

Este esquema proporciona una base sólida para la gestión completa de préstamos y puede expandirse fácilmente con nuevas funcionalidades.
