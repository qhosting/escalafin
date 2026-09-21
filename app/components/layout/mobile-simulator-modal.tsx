'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Smartphone,
  RotateCw,
  X,
  ExternalLink,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Monitor,
  Check,
  ChevronDown,
  Eye,
  Briefcase,
  Users,
  DollarSign,
  UserCheck,
  LayoutDashboard,
  Building2,
  Search,
  LogOut,
  Loader2,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMobileSimulator, DEVICE_SPECS, SimulatedDevice } from '@/hooks/use-mobile-simulator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdvisorItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  tenantId: string | null;
  tenantName: string;
  tenantSlug: string | null;
  clientCount: number;
}

const PORTAL_VIEWS = [
  { label: 'Portal Asesor Móvil', path: '/pwa/asesor', icon: Briefcase, role: 'ASESOR', desc: 'Cartera de clientes y cobranza' },
  { label: 'Ruta de Cobranza', path: '/mobile/cobranza', icon: DollarSign, role: 'ASESOR', desc: 'Gestión de cobros en campo' },
  { label: 'Portal Cliente Móvil', path: '/pwa/client', icon: UserCheck, role: 'CLIENTE', desc: 'Consulta de préstamos y pagos' },
  { label: 'Dashboard Admin Móvil', path: '/pwa/admin/dashboard', icon: LayoutDashboard, role: 'ADMIN', desc: 'Métricas e indicadores ejecutivos' },
  { label: 'Hub PWA Principal', path: '/pwa', icon: Smartphone, role: 'GENERAL', desc: 'Pantalla de selección de aplicaciones' },
];

export function MobileSimulatorModal() {
  const { data: session, update } = useSession();
  const {
    isOpen,
    device,
    isLandscape,
    zoom,
    targetPath,
    close,
    setDevice,
    toggleOrientation,
    setZoom,
    setTargetPath
  } = useMobileSimulator();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Estado para el modal de selección de Asesores (Intrapersona)
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [advisors, setAdvisors] = useState<AdvisorItem[]>([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('ALL');
  const [impersonatingLoading, setImpersonatingLoading] = useState(false);

  const isSuperAdmin =
    session?.user?.role === 'SUPER_ADMIN' ||
    (session?.user as any)?.originalUser?.role === 'SUPER_ADMIN';

  const isImpersonating = !!(session?.user as any)?.isImpersonating;
  const originalUser = (session?.user as any)?.originalUser;

  // Reloj de la barra de estado del teléfono
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar asesores cuando se abre el selector
  useEffect(() => {
    if (isAdvisorModalOpen && isSuperAdmin) {
      loadAdvisors();
    }
  }, [isAdvisorModalOpen, isSuperAdmin]);

  const loadAdvisors = async () => {
    try {
      setLoadingAdvisors(true);
      const res = await fetch('/api/admin/impersonate/advisors');
      if (res.ok) {
        const data = await res.json();
        setAdvisors(data.advisors || []);
      } else {
        toast.error('No se pudo cargar la lista de asesores');
      }
    } catch (err) {
      console.error('Error cargando asesores:', err);
      toast.error('Error de conexión al cargar asesores');
    } finally {
      setLoadingAdvisors(false);
    }
  };

  // Iniciar Intrapersona (login como asesor seleccionado)
  const handleStartImpersonate = async (advisor: AdvisorItem) => {
    try {
      setImpersonatingLoading(true);

      // Registrar auditoría
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'impersonate', targetUserId: advisor.id }),
      }).catch(() => {});

      // Actualizar sesión NextAuth
      await update({ action: 'impersonate', targetUserId: advisor.id });

      toast.success(`🎭 Has iniciado sesión como ${advisor.name} (${advisor.tenantName})`);
      setIsAdvisorModalOpen(false);

      // Redirigir el simulador directamente al portal asesor
      setTargetPath('/pwa/asesor');
      setIframeKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error al iniciar intrapersona:', error);
      toast.error('Error al asumir identidad del asesor');
    } finally {
      setImpersonatingLoading(false);
    }
  };

  // Salir de Intrapersona (volver a SuperAdmin)
  const handleStopImpersonate = async () => {
    try {
      setImpersonatingLoading(true);

      // Registrar auditoría
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stopImpersonate' }),
      }).catch(() => {});

      // Restaurar sesión NextAuth
      await update({ action: 'stopImpersonate' });

      toast.success('Has regresado a tu cuenta de SuperAdmin');
      setIframeKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error al salir de intrapersona:', error);
      toast.error('Error al restaurar sesión de SuperAdmin');
    } finally {
      setImpersonatingLoading(false);
    }
  };

  // Atajo de teclado: Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAdvisorModalOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAdvisorModalOpen, close]);

  if (!isOpen) return null;

  const currentSpecs = DEVICE_SPECS[device];
  const width = isLandscape ? currentSpecs.height : currentSpecs.width;
  const height = isLandscape ? currentSpecs.width : currentSpecs.height;

  // URL a cargar dentro del iframe: si hay targetPath explícito usarlo, sino la ruta actual
  const currentScreenUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
  const targetUrl = targetPath || currentScreenUrl;

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(targetUrl, '_blank', `width=${width},height=${height}`);
  };

  // Lista de tenants para filtro
  const uniqueTenants = Array.from(new Set(advisors.map((a) => a.tenantName))).filter(Boolean);

  const filteredAdvisors = advisors.filter((adv) => {
    const matchesSearch =
      adv.name.toLowerCase().includes(advisorSearch.toLowerCase()) ||
      adv.email.toLowerCase().includes(advisorSearch.toLowerCase()) ||
      adv.tenantName.toLowerCase().includes(advisorSearch.toLowerCase());
    const matchesTenant =
      selectedTenantFilter === 'ALL' || adv.tenantName === selectedTenantFilter;
    return matchesSearch && matchesTenant;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* ─── BARRA DE CONTROL SUPERIOR ─────────────────────────────────────── */}
      <header className="h-14 bg-slate-900/90 border-b border-white/10 px-3 md:px-6 flex items-center justify-between shrink-0 select-none gap-2">
        {/* Lado Izquierdo: Info, Dispositivo y Modo */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  Modo Móvil
                </span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0 font-medium">
                  Touch
                </Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden lg:block">
                {width} × {height} px • {Math.round(zoom * 100)}%
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Selector de Dispositivo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1.5 bg-slate-800/80 border-white/10 hover:bg-slate-700 text-slate-200 text-xs rounded-lg hidden sm:flex"
              >
                <span className="font-semibold">{currentSpecs.name}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-200">
              <DropdownMenuLabel className="text-[11px] text-slate-400">
                Seleccionar Dispositivo
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {(Object.keys(DEVICE_SPECS) as SimulatedDevice[]).map((key) => {
                const spec = DEVICE_SPECS[key];
                const isSelected = device === key;
                return (
                  <DropdownMenuItem
                    key={key}
                    className="flex items-center justify-between text-xs cursor-pointer focus:bg-slate-800 focus:text-white"
                    onClick={() => setDevice(key)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{spec.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {spec.width} × {spec.height} px
                      </span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ─── 1. CONTROL DE VISUALIZACIÓN DE PORTALES ─── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 gap-1.5 bg-indigo-950/60 border-indigo-500/30 hover:bg-indigo-900/60 text-indigo-200 text-xs rounded-lg font-medium shadow-sm transition-all"
                title="Cambiar qué pantalla o portal móvil visualizar"
              >
                <Eye className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="hidden sm:inline">Visualizar Portal</span>
                <ChevronDown className="h-3 w-3 text-indigo-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-200 w-64">
              <DropdownMenuLabel className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Vistas Móviles Disponibles</span>
                <Badge variant="outline" className="text-[9px] h-3.5 border-indigo-500/30 text-indigo-300">
                  Previsualización
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />

              {PORTAL_VIEWS.map((portal) => {
                const Icon = portal.icon;
                const isSelected = targetPath === portal.path;
                return (
                  <DropdownMenuItem
                    key={portal.path}
                    className="flex items-start gap-2.5 text-xs cursor-pointer focus:bg-slate-800 focus:text-white py-2"
                    onClick={() => {
                      setTargetPath(portal.path);
                      setIframeKey((p) => p + 1);
                      toast.info(`Cambiando vista a: ${portal.label}`);
                    }}
                  >
                    <div className="p-1.5 rounded-md bg-white/5 text-indigo-400 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{portal.label}</span>
                        {isSelected && <Check className="h-3 w-3 text-indigo-400 shrink-0 ml-1" />}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {portal.desc}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="flex items-center justify-between text-xs cursor-pointer focus:bg-slate-800 focus:text-white"
                onClick={() => {
                  setTargetPath(null);
                  setIframeKey((p) => p + 1);
                  toast.info('Mostrando pantalla actual de escritorio en versión móvil');
                }}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-slate-400" />
                  <span>Pantalla actual de fondo</span>
                </div>
                {targetPath === null && <Check className="h-3.5 w-3.5 text-indigo-400" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ─── 2. CONTROL INTRAPERSONA (LOGIN COMO ASESOR / AGENTE) ─── */}
          {isSuperAdmin && (
            <>
              {isImpersonating ? (
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="text-[11px] font-bold text-amber-300 hidden md:inline truncate max-w-[140px]">
                    {session?.user?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={impersonatingLoading}
                    onClick={handleStopImpersonate}
                    className="h-6 px-1.5 text-[10px] bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 rounded font-semibold gap-1 ml-1"
                    title="Cerrar sesión de asesor y volver a SuperAdmin"
                  >
                    {impersonatingLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <LogOut className="h-2.5 w-2.5" />
                    )}
                    <span>Volver a SuperAdmin</span>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdvisorModalOpen(true)}
                  className="h-8 px-2.5 gap-1.5 bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-500/40 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-200 text-xs rounded-lg font-bold shadow-sm transition-all"
                  title="Hacer login real como un agente o asesor específico"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Ser Intrapersona</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-400/40 text-amber-300 ml-0.5 hidden sm:inline">
                    Login Asesor
                  </Badge>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Lado Derecho: Controles de orientación, zoom y salida */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Rotar Orientación */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 gap-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs",
              isLandscape && "bg-primary/20 text-primary hover:bg-primary/30"
            )}
            onClick={toggleOrientation}
            title={isLandscape ? "Cambiar a modo Vertical" : "Cambiar a modo Horizontal"}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">
              {isLandscape ? 'Horizontal' : 'Vertical'}
            </span>
          </Button>

          {/* Selector de Zoom */}
          <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg border border-white/10 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              onClick={() => setZoom(Math.max(0.7, Number((zoom - 0.1).toFixed(1))))}
              title="Reducir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-white rounded"
              onClick={() => setZoom(Math.min(1.1, Number((zoom + 0.1).toFixed(1))))}
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Recargar Iframe */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            onClick={handleRefresh}
            title="Recargar vista móvil"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Abrir en ventana externa */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hidden lg:flex"
            onClick={handleOpenExternal}
            title="Abrir en ventana emergente móvil"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Cerrar y Volver a Escritorio */}
          <Button
            variant="default"
            size="sm"
            className="h-8 px-2.5 md:px-3 gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md"
            onClick={close}
            title="Cerrar simulador (Esc)"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cerrar</span>
          </Button>
        </div>
      </header>

      {/* ─── BANNER SUPERIOR INTRAPERSONA ACTIVO ─────────────────────────────── */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-1.5 shadow-md flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-base">🎭</span>
            <span className="font-bold">Modo Intrapersona Activo:</span>
            <span className="bg-black/20 px-2 py-0.5 rounded font-mono font-semibold">
              {session?.user?.name} ({session?.user?.role})
            </span>
            <span className="text-amber-100 hidden sm:inline">
              Organización: {session?.user?.tenantName || 'Global'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={impersonatingLoading}
            onClick={handleStopImpersonate}
            className="h-6 px-2 text-[11px] bg-black/40 hover:bg-black/60 text-white border-white/20 font-bold rounded"
          >
            {impersonatingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3 mr-1" />}
            Volver a SuperAdmin
          </Button>
        </div>
      )}

      {/* ─── ÁREA DE DISPOSITIVO MÓVIL ─────────────────────────────────────── */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8">
        <div
          className="transition-all duration-300 ease-out origin-center"
          style={{
            transform: `scale(${zoom})`,
          }}
        >
          {/* Chasis Exterior del Smartphone */}
          <div
            className={cn(
              "relative bg-slate-900 border-[8px] border-slate-800 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]",
              isLandscape ? "rounded-[42px]" : "rounded-[52px]",
              "flex flex-col overflow-hidden"
            )}
            style={{
              width: `${width + 16}px`,
              height: `${height + 16}px`,
            }}
          >
            {/* Marco de Pantalla Interior */}
            <div className="relative flex-1 bg-black flex flex-col overflow-hidden rounded-[40px]">
              {/* Barra de Estado Móvil Superior (Hora, Dynamic Island / Notch, Batería) */}
              <div className="h-9 w-full bg-slate-950 text-white flex items-center justify-between px-6 select-none shrink-0 z-20">
                <span className="text-[12px] font-semibold tracking-tight">
                  {currentTime}
                </span>

                {/* Dynamic Island / Notch */}
                {currentSpecs.frameType === 'dynamic-island' && (
                  <div className="h-4 w-28 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-white/5">
                    <div className="h-2 w-2 rounded-full bg-[#0a1128] border border-blue-500/30" />
                  </div>
                )}
                {currentSpecs.frameType === 'punch-hole' && (
                  <div className="h-3 w-3 rounded-full bg-black border border-white/10" />
                )}
                {currentSpecs.frameType === 'notch' && (
                  <div className="h-3.5 w-32 bg-slate-900 rounded-b-xl" />
                )}

                {/* Iconos de Estado (WiFi, Batería) */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-semibold text-[10px]">5G</span>
                  <div className="h-2.5 w-5 border border-white/80 rounded-xs p-0.5 flex items-center">
                    <div className="h-full w-full bg-emerald-400 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Iframe con la Aplicación Móvil */}
              <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-hidden">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={targetUrl}
                  title="Vista Móvil EscalaFin"
                  className="w-full h-full border-0"
                  style={{
                    width: `${width}px`,
                    height: `${height - 56}px`, // Descontando status bar y home indicator
                  }}
                />
              </div>

              {/* Barra Inferior Home Indicator (Estilo iOS / Android) */}
              <div className="h-5 w-full bg-slate-950 flex items-center justify-center shrink-0 z-20">
                <div className="h-1 w-32 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MODAL SELECCIÓN DE ASESOR PARA INTRAPERSONA ───────────────────── */}
      <Dialog open={isAdvisorModalOpen} onOpenChange={setIsAdvisorModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-white/10 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  Modo Intrapersona: Iniciar Sesión como Asesor
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Elige a un asesor o agente registrado en el sistema para asumir su identidad y operar la versión móvil como él.
                </DialogDescription>
              </div>
            </div>

            {/* Buscador y Filtro por Organización */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, email u organización..."
                  value={advisorSearch}
                  onChange={(e) => setAdvisorSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-800/80 border-slate-700 text-slate-200 placeholder:text-slate-500 text-xs rounded-xl"
                />
              </div>

              {uniqueTenants.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  <Button
                    variant={selectedTenantFilter === 'ALL' ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "h-9 text-[11px] rounded-xl font-medium shrink-0",
                      selectedTenantFilter === 'ALL'
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    )}
                    onClick={() => setSelectedTenantFilter('ALL')}
                  >
                    Todos ({advisors.length})
                  </Button>
                  {uniqueTenants.map((tenant) => (
                    <Button
                      key={tenant}
                      variant={selectedTenantFilter === tenant ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-9 text-[11px] rounded-xl font-medium shrink-0",
                        selectedTenantFilter === tenant
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      )}
                      onClick={() => setSelectedTenantFilter(tenant)}
                    >
                      {tenant}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Lista de Asesores */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loadingAdvisors ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-xs">Cargando asesores y agentes registrados...</p>
              </div>
            ) : filteredAdvisors.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No se encontraron asesores</p>
                <p className="text-xs text-slate-500 mt-1">
                  Intenta cambiar el término de búsqueda o asegúrate de que haya usuarios con rol ASESOR activos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredAdvisors.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 hover:border-amber-500/40 hover:bg-slate-800 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {adv.name.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {adv.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-300 uppercase font-mono">
                            {adv.role}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                          <span className="truncate">{adv.email}</span>
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Building2 className="h-3 w-3 text-slate-500" />
                            {adv.tenantName}
                          </span>
                          <span className="text-emerald-400 font-medium">
                            {adv.clientCount} clientes
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={impersonatingLoading}
                      onClick={() => handleStartImpersonate(adv)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-9 px-3 rounded-xl shrink-0 gap-1.5 shadow-md shadow-amber-900/30 group-hover:scale-105 transition-transform"
                    >
                      {impersonatingLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      <span>Hacer Login</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
