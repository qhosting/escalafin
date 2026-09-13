'use client';

import { Suspense } from 'react';
import AuditLogViewer from '@/components/audit/audit-log-viewer';
import { LoanTableSkeleton } from '@/components/ui/skeletons';

export default function AuditPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Suspense fallback={<LoanTableSkeleton rows={8} />}>
        <AuditLogViewer />
      </Suspense>
    </div>
  );
}
