'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Navigation, Phone, MessageCircle, MapPin, DollarSign, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

/**
 * /mobile/asesor/route
 * Optimized collection route for field agents in the native Capacitor app.
 * Shows today's priority clients sorted by overdue status and provides
 * GPS navigation, calling, and quick payment links.
 */

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function AsesorRoutePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [stats, setStats] = useState({ total: 0, overdue: 0, collected: 0, collectedAmount: 0 });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadRoute();
      getLocation();
    }
  }, [session]);

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const runningInCapacitor = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

      if (runningInCapacitor) {
        // Use Capacitor Geolocation via the global Capacitor object injected by the native shell
        const cap = (window as any).Capacitor;
        const pos = await cap.Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('GPS nativo obtenido');
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          toast.success('Ubicación obtenida');
        });
      }
    } catch (e) {
      console.warn('Geolocation not available');
    } finally {
      setGettingLocation(false);
    }
  };

  const loadRoute = async () => {
    setLoading(true);
    try {
      // Load loans assigned to this advisor, prioritized by overdue status
      const res = await fetch('/api/loans?status=ACTIVE&includeClient=true&limit=50');
      const data = await res.json();
      const loansList = data.loans || [];

      // Sort: overdue first, then by overdue amount descending
      loansList.sort((a: any, b: any) => {
        if (a.status === 'DEFAULTED' && b.status !== 'DEFAULTED') return -1;
        if (b.status === 'DEFAULTED' && a.status !== 'DEFAULTED') return 1;
        return Number(b.balanceRemaining) - Number(a.balanceRemaining);
      });

      setLoans(loansList);

      // Load today's collections for stats
      const today = new Date().toISOString().split('T')[0];
      const payRes = await fetch(`/api/payments/cash?collectorId=${session?.user?.id}&dateFrom=${today}&dateTo=${today}`);
      if (payRes.ok) {
        const payData = await payRes.json();
        setStats({
          total: loansList.length,
          overdue: loansList.filter((l: any) => l.status === 'DEFAULTED').length,
          collected: payData.stats?.totalPayments || 0,
          collectedAmount: payData.stats?.totalAmount || 0,
        });
      }
    } catch (e) {
      toast.error('Error cargando ruta');
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (client: any) => {
    const address = client.address ? `${client.address}, ${client.city || ''}` : null;
    if (!address && !client.latitude) {
      toast.error('Sin dirección disponible');
      return;
    }

    let mapsUrl = '';
    if (currentLocation && client.latitude && client.longitude) {
      mapsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${client.latitude},${client.longitude}`;
    } else if (address) {
      mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    }

    window.open(mapsUrl, '_blank');
  };

  const call = (phone: string) => { if (phone) window.location.href = `tel:${phone}`; };
  const whatsapp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, le contactamos de EscalaFin para recordarle su pago.`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 pt-12 pb-4 safe-area-top">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black">Ruta de Cobro</h1>
            <p className="text-blue-200 text-xs mt-0.5">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={loadRoute} className="bg-white/20 p-2.5 rounded-xl active:scale-95">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {/* GPS indicator */}
        <div className="flex items-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full ${currentLocation ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-xs text-blue-200 font-medium">
            {currentLocation ? `GPS Activo (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})` : 'Obteniendo ubicación...'}
          </span>
        </div>
      </div>

      {/* Today stats */}
      <div className="px-4 -mt-1 pt-3 pb-3 bg-blue-700/10">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-700' },
            { label: 'En Mora', value: stats.overdue, color: 'text-red-600' },
            { label: 'Cobros', value: stats.collected, color: 'text-emerald-600' },
            { label: 'Cobrado', value: fmt(stats.collectedAmount).replace('MXN', '').replace('$', '$').slice(0, 8), color: 'text-blue-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl py-2 px-1 shadow-sm">
              <p className={`text-base font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-slate-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 text-blue-600 animate-spin" /></div>
        ) : loans.length === 0 ? (
          <p className="text-center text-slate-400 italic text-sm py-12">Sin clientes en ruta hoy</p>
        ) : (
          loans.map((loan: any, idx: number) => (
            <Card key={loan.id} className={`rounded-2xl border-0 shadow-sm overflow-hidden ${
              loan.status === 'DEFAULTED' ? 'border-l-4 border-l-red-500' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                      loan.status === 'DEFAULTED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white">
                        {loan.client?.firstName} {loan.client?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{loan.loanNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-600">{fmt(Number(loan.balanceRemaining || 0))}</p>
                    <Badge className={`text-[9px] font-bold ${loan.status === 'DEFAULTED' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {loan.status === 'DEFAULTED' ? 'En Mora' : 'Activo'}
                    </Badge>
                  </div>
                </div>

                {loan.client?.address && (
                  <p className="text-[11px] text-slate-400 mb-2.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{loan.client.address}, {loan.client.city}</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <Link href={`/pwa/admin/payments/new?loanId=${loan.id}`} className="flex-1">
                    <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <DollarSign className="h-3.5 w-3.5" /> Cobrar
                    </div>
                  </Link>
                  <button onClick={() => openMaps(loan.client)} className="p-2.5 rounded-xl border border-slate-200 active:scale-95 transition-transform" title="Navegar">
                    <Navigation className="h-4 w-4 text-blue-600" />
                  </button>
                  {loan.client?.phone && <>
                    <button onClick={() => call(loan.client.phone)} className="p-2.5 rounded-xl border border-slate-200 active:scale-95 transition-transform">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </button>
                    <button onClick={() => whatsapp(loan.client.phone, loan.client.firstName)} className="p-2.5 rounded-xl border border-slate-200 active:scale-95 transition-transform">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </button>
                  </>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
