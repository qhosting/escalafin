'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CashPaymentForm from '@/components/payments/cash-payment-form';
import { AuthWrapper } from '@/components/auth-wrapper';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

function NewPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loanId = searchParams.get('loanId');

    const [loan, setLoan] = useState<any>(null);

    useEffect(() => {
        if (loanId) {
            fetch(`/api/loans/${loanId}`)
                .then(res => res.json())
                .then(data => setLoan(data.loan || data))
                .catch(console.error);
        }
    }, [loanId]);

    return (
        <div className="max-w-3xl mx-auto py-8">
            {loanId && !loan ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <CashPaymentForm
                    loan={loan}
                    onSuccess={() => {
                        router.push(loanId ? `/admin/loans/${loanId}` : '/admin/payments');
                    }}
                    onCancel={() => {
                        router.back();
                    }}
                />
            )}
        </div>
    );
}

export default function NewPaymentPage() {
    return (
        <AuthWrapper allowedRoles={['ADMIN', 'ASESOR']}>
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>}>
                <NewPaymentContent />
            </Suspense>
        </AuthWrapper>
    );
}
