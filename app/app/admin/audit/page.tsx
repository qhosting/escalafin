
'use client';

import { Suspense } from 'react';
import AuditLogViewer from '@/components/audit/audit-log-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Auditoría
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitoreo completo de actividades del sistema y trazabilidad de operaciones
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Cargando Sistema de Auditoría...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <AuditLogViewer />
      </Suspense>
    </div>
  );
}
