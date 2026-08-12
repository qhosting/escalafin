'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Phone, Navigation, MessageCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PWAAdminClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) loadClients();
  }, [session]);

  const loadClients = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/clients?search=${encodeURIComponent(q)}&limit=40` : '/api/clients?limit=40&status=ACTIVE';
      const res = await fetch(url);
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {
      toast.error('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  const call = (phone: string) => { if (phone) window.location.href = `tel:${phone}`; };
  const whatsapp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, le contactamos de EscalaFin.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };
  const maps = (address: string) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 pt-12 pb-5 safe-area-top">
        <h1 className="text-xl font-black tracking-tight">Clientes</h1>
        <p className="text-blue-200 text-xs mt-0.5">{clients.length} clientes cargados</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 text-sm"
              placeholder="Nombre, teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadClients(search)}
            />
          </div>
          <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3" onClick={() => loadClients(search)} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 text-blue-600 animate-spin" /></div>
        ) : clients.length === 0 ? (
          <p className="text-center text-slate-400 italic text-sm py-12">No se encontraron clientes</p>
        ) : (
          clients.map((client: any) => (
            <Card key={client.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white">{client.firstName} {client.lastName}</p>
                    <p className="text-[11px] text-slate-400">{client.phone}</p>
                  </div>
                  <Badge className={`text-[9px] font-bold ml-2 flex-shrink-0 ${
                    client.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                    client.status === 'BLACKLISTED' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'
                  }`}>
                    {client.status === 'ACTIVE' ? 'Activo' : client.status === 'BLACKLISTED' ? 'Lista Negra' : client.status}
                  </Badge>
                </div>
                {client.address && (
                  <p className="text-xs text-slate-400 mb-2.5 truncate">{client.address}, {client.city}</p>
                )}
                <div className="flex gap-2">
                  {client.phone && <>
                    <button onClick={() => call(client.phone)} className="flex-1 py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-700">Llamar</span>
                    </button>
                    <button onClick={() => whatsapp(client.phone, client.firstName)} className="flex-1 py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-bold text-slate-700">WA</span>
                    </button>
                  </>}
                  {client.address && (
                    <button onClick={() => maps(client.address)} className="flex-1 py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <Navigation className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">Maps</span>
                    </button>
                  )}
                  <Link href={`/admin/clients/${client.id}`} className="flex-shrink-0 p-2 rounded-xl border border-slate-200 flex items-center justify-center active:scale-95 transition-transform">
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
