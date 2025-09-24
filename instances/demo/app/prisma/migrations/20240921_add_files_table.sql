
-- Migración para agregar tabla de archivos con soporte dual (local/S3)

CREATE TABLE "File" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "description" TEXT,
  "clientId" TEXT,
  "uploadedById" TEXT NOT NULL,
  "storageType" TEXT NOT NULL DEFAULT 'local',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- Índices para mejorar performance
CREATE INDEX "File_clientId_idx" ON "File"("clientId");
CREATE INDEX "File_uploadedById_idx" ON "File"("uploadedById");
CREATE INDEX "File_category_idx" ON "File"("category");
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- Relaciones con otras tablas
ALTER TABLE "File" ADD CONSTRAINT "File_clientId_fkey" 
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "File" ADD CONSTRAINT "File_uploadedById_fkey" 
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
