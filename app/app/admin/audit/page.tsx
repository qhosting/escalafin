
'use client';

import { Suspense } from 'react';
import AuditLogViewer from '@/components/audit/audit-log-viewer';
import { LoanTableSkeleton } from '@/components/ui/skeletons';

export default function AuditPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Auditoría
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitoreo completo de actividades del sistema y trazabilidad de operaciones
        </p>
      </div>

      <Suspense fallback={<LoanTableSkeleton rows={8} />}>
        <AuditLogViewer />
      </Suspense>
    </div>
  );
}
