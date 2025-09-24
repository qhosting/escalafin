
'use client';

import { NewLoanForm } from '@/components/loans/new-loan-form';
import { AuthWrapper } from '@/components/auth-wrapper';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function NewLoanPage() {
  return (
    <AuthWrapper allowedRoles={['ADMIN']}>
      <div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/loans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Préstamos
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Nuevo Préstamo</h1>
              <p className="text-muted-foreground">Crear un nuevo préstamo para un cliente</p>
            </div>
          </div>

          <NewLoanForm />
        </div>
      </div>
    </AuthWrapper>
  );
}
