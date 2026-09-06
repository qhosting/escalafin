-- Migración para convertir todos los nombres existentes a MAYÚSCULAS
-- EscalaFin OS

-- 1. Actualizar registros existentes de Clientes a MAYÚSCULAS
UPDATE clients
SET 
  "firstName" = UPPER(TRIM("firstName")),
  "lastName" = UPPER(TRIM("lastName")),
  "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END,
  "city" = CASE WHEN "city" IS NOT NULL THEN UPPER(TRIM("city")) ELSE NULL END,
  "state" = CASE WHEN "state" IS NOT NULL THEN UPPER(TRIM("state")) ELSE NULL END,
  "employerName" = CASE WHEN "employerName" IS NOT NULL THEN UPPER(TRIM("employerName")) ELSE NULL END,
  "workAddress" = CASE WHEN "workAddress" IS NOT NULL THEN UPPER(TRIM("workAddress")) ELSE NULL END,
  "bankName" = CASE WHEN "bankName" IS NOT NULL THEN UPPER(TRIM("bankName")) ELSE NULL END
WHERE 
  "firstName" != UPPER("firstName") OR 
  "lastName" != UPPER("lastName") OR
  ("address" IS NOT NULL AND "address" != UPPER("address")) OR
  ("city" IS NOT NULL AND "city" != UPPER("city")) OR
  ("state" IS NOT NULL AND "state" != UPPER("state")) OR
  ("employerName" IS NOT NULL AND "employerName" != UPPER("employerName")) OR
  ("workAddress" IS NOT NULL AND "workAddress" != UPPER("workAddress")) OR
  ("bankName" IS NOT NULL AND "bankName" != UPPER("bankName"));

-- 2. Actualizar Avales (Guarantors) a MAYÚSCULAS
UPDATE guarantors
SET 
  "fullName" = UPPER(TRIM("fullName")),
  "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END
WHERE 
  "fullName" != UPPER("fullName") OR 
  ("address" IS NOT NULL AND "address" != UPPER("address"));

-- 3. Actualizar Referencias Personales a MAYÚSCULAS
UPDATE personal_references
SET 
  "fullName" = UPPER(TRIM("fullName")),
  "address" = CASE WHEN "address" IS NOT NULL THEN UPPER(TRIM("address")) ELSE NULL END
WHERE 
  "fullName" != UPPER("fullName") OR 
  ("address" IS NOT NULL AND "address" != UPPER("address"));

-- 4. Actualizar Garantías / Bienes (Collaterals) a MAYÚSCULAS
UPDATE collaterals
SET 
  "description" = UPPER(TRIM("description"))
WHERE 
  "description" != UPPER("description");

