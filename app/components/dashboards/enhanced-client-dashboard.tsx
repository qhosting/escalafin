
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import {
  Building2,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  LogOut,
  ArrowRight,
  Bell,
  Calculator,
  Globe,
  FileText,
  User,
  FolderOpen,
  FilePlus,
  Receipt,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { ClientProfileImage } from '@/components/clients/client-profile-image';

interface ClientDashboardData {
  activeLoans: Array<{
    id: string;
    type: string;
    originalAmount: number;
    remainingBalance: number;
    monthlyPayment: number;
    nextPaymentDate?: string;
    status: string;
  }>;
  recentPayments: Array<{
    date: string;
    amount: number;
    status: string;
    reference: string;
  }>;
  creditApplications: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  summary: {
    totalDebt: number;
    totalMonthlyPayment: number;
    activeLoansCount: number;
    nextPayment: {
      amount: number;
      date?: string;
      loanNumber: string;
    } | null;
  };
  tenant?: {
    name: string;
    logo: string | null;
    primaryColor: string | null;
  } | null;
}

// Nav item component for the grid
function NavItem({ icon: Icon, label, href, color, bgColor, moduleKey }: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
  bgColor: string;
  moduleKey: string;
}) {
  return (
    <ModuleWrapper moduleKey={moduleKey}>
      <Link href={href}>
        <div className="flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-all duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">
          <div className={`${bgColor} p-3.5 rounded-2xl shadow-sm`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 text-center leading-tight">{label}</span>
        </div>
      </Link>
    </ModuleWrapper>
  );
}

export function EnhancedClientDashboard() {
  const { data: session, status } = useSession() || {};
  const { modules, loading: modulesLoading } = useModules();
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [clientInfo, setClientInfo] = useState<{ id: string; profileImage: string | null; name: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/client-stats');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoadingData(false);
      }
    }
    if (session?.user?.role === 'CLIENTE') fetchData();
  }, [session]);

  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await fetch('/api/clients/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.client) {
            setClientInfo({
              id: data.client.id,
              profileImage: data.client.profileImage,
              name: `${data.client.firstName} ${data.client.lastName}`,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching client info:', error);
      }
    }
    if (session?.user?.role === 'CLIENTE') fetchClientInfo();
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  const activeLoans = dashboardData?.activeLoans || [];
  const recentPayments = dashboardData?.recentPayments || [];
  const nextPayment = dashboardData?.summary?.nextPayment;

  const allModules = [
    { label: 'Mis Préstamos', icon: CreditCard, href: '/cliente/loans', color: 'text-blue-600', bgColor: 'bg-blue-50', moduleKey: 'my_loans' },
    { label: 'Solicitar', icon: FilePlus, href: '/cliente/credit-applications/new', color: 'text-green-600', bgColor: 'bg-green-50', moduleKey: 'credit_application_create' },
    { label: 'Solicitudes', icon: FileText, href: '/cliente/credit-applications', color: 'text-orange-500', bgColor: 'bg-orange-50', moduleKey: 'credit_application_list' },
    { label: 'Pagar', icon: Globe, href: '/cliente/pay-online', color: 'text-emerald-600', bgColor: 'bg-emerald-50', moduleKey: 'payment_online' },
    { label: 'Historial', icon: Receipt, href: '/cliente/payments', color: 'text-purple-600', bgColor: 'bg-purple-50', moduleKey: 'payment_history' },
    { label: 'Calendario', icon: Calendar, href: '/cliente/payments/schedule', color: 'text-blue-500', bgColor: 'bg-blue-50', moduleKey: 'payment_schedule' },
    { label: 'Mi Perfil', icon: User, href: '/cliente/profile', color: 'text-indigo-600', bgColor: 'bg-indigo-50', moduleKey: 'client_profile' },
    { label: 'Documentos', icon: FolderOpen, href: '/cliente/files', color: 'text-yellow-600', bgColor: 'bg-yellow-50', moduleKey: 'file_manager' },
    { label: 'Calculadora', icon: Calculator, href: '/cliente/calculator', color: 'text-teal-600', bgColor: 'bg-teal-50', moduleKey: 'loan_calculator' },
  ];

  if (status === 'loading' || modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  const tenantName = dashboardData?.tenant?.name || 'EscalaFin';
  const tenantLogo = dashboardData?.tenant?.logo;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">

      {/* ── Top Bar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {tenantLogo ? (
              <div className="relative h-8 w-24">
                <Image src={tenantLogo} alt={tenantName} fill className="object-contain" />
              </div>
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold text-base text-gray-900 dark:text-white">{tenantName}</span>
          </div>
          <div className="flex items-center gap-2">
            {clientInfo && (
              <ClientProfileImage
                clientId={clientInfo.id}
                currentImage={clientInfo.profileImage}
                clientName={clientInfo.name}
                editable={false}
                size="sm"
              />
            )}
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="p-2">
              <LogOut className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5 p-4">

        {/* ── Greeting ── */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Portal del Cliente</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            Hola, {session?.user?.name?.split(' ')[0] || 'Cliente'} 👋
          </h1>
        </div>

        {/* ── Next Payment Alert ── */}
        {loadingData ? (
          <div className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
        ) : nextPayment ? (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Próximo Pago</p>
                  <p className="text-[11px] text-orange-100 mt-0.5">
                    {nextPayment.date
                      ? new Date(nextPayment.date).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'Fecha por confirmar'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold">
                  ${nextPayment.amount.toLocaleString('es-MX')}
                </p>
                <p className="text-[10px] text-orange-100">{nextPayment.loanNumber}</p>
              </div>
            </div>
          </div>
        ) : activeLoans.length === 0 ? null : null}

        {/* ── Quick Stats (solo si hay préstamos) ── */}
        {!loadingData && activeLoans.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Préstamos Activos</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{activeLoans.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Saldo Total</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                ${dashboardData?.summary?.totalDebt?.toLocaleString('es-MX') || '0'}
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation Grid ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-2">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider px-2 pt-2 mb-1">Accesos Rápidos</p>
          <div className="grid grid-cols-3 gap-1">
            {allModules.map((mod) => (
              <NavItem key={mod.moduleKey} {...mod} />
            ))}
          </div>
        </div>

        {/* ── Active Loans ── */}
        <ModuleWrapper moduleKey="my_loans">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Mis Préstamos</h2>
              <Link href="/cliente/loans">
                <span className="text-xs text-primary font-semibold flex items-center gap-1">Ver todos <ChevronRight className="h-3 w-3" /></span>
              </Link>
            </div>
            {loadingData ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
                <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Sin préstamos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const pct = loan.originalAmount > 0
                    ? Math.round(((loan.originalAmount - loan.remainingBalance) / loan.originalAmount) * 100)
                    : 0;
                  return (
                    <div key={loan.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm active:scale-[0.99] transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{loan.type}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">ID: {loan.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-[10px] border-0">Activo</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        <div>
                          <p className="text-gray-400">Saldo Restante</p>
                          <p className="font-bold text-blue-600 text-sm">${loan.remainingBalance.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Pago Semanal</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">${loan.monthlyPayment.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Progreso</span>
                          <span>{pct}% pagado</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModuleWrapper>

        {/* ── Recent Payments ── */}
        <ModuleWrapper moduleKey="payment_history">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Últimos Pagos</h2>
              <Link href="/cliente/payments">
                <span className="text-xs text-primary font-semibold flex items-center gap-1">Ver todos <ChevronRight className="h-3 w-3" /></span>
              </Link>
            </div>
            {loadingData ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />)}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Sin pagos registrados</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${payment.amount.toLocaleString('es-MX')}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(payment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                      Completado
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModuleWrapper>

      </div>
    </div>
  );
}
