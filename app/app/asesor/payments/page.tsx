'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
interface Payment { id: string; amount: string; status: string; paymentDate: string; loan: { loanNumber: string; client: { firstName: string; lastName: string } } }
export default function AdvisorPayments() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, mutate } = useSWR<{ payments: Payment[]; totalPages: number }>(`/api/payments?page=${page}&limit=20`, async (url: string) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudieron cargar tus pagos');
    return response.json();
  });
  return <section className="space-y-4"><h1 className="text-2xl font-semibold">Pagos de mis clientes</h1>
    {error ? <div role="alert">{error.message} <Button onClick={() => mutate()}>Reintentar</Button></div> : isLoading ? <p role="status">Cargando pagos…</p> : <>
      <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Historial de pagos de clientes asignados</caption><thead><tr>{['Cliente', 'Préstamo', 'Fecha', 'Monto', 'Estado'].map(h => <th scope="col" className="p-3 text-left" key={h}>{h}</th>)}</tr></thead><tbody>
        {data?.payments.map(payment => <tr key={payment.id} className="border-t"><td className="p-3">{payment.loan.client.firstName} {payment.loan.client.lastName}</td><td>{payment.loan.loanNumber}</td><td>{new Date(payment.paymentDate).toLocaleDateString('es-MX')}</td><td>{Number(payment.amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td><td>{payment.status}</td></tr>)}
      </tbody></table></div>
      {!data?.payments.length && <p>No hay pagos para mostrar.</p>}
      <div className="flex items-center gap-3"><Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button><span>Página {page}</span><Button disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Siguiente</Button></div>
    </>}
  </section>;
}
