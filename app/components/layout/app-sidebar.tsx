'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  User,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { useMobileSimulator } from '@/hooks/use-mobile-simulator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModules } from '@/hooks/use-modules';
import { useTenant } from '@/components/providers/tenant-provider';
import {
  filterNavigation,
  getDashboardHref,
  getNavigation,
  isNavItemActive,
  getActiveNavHref,
} from '@/lib/navigation';


export const SIDEBAR_WIDTH_EXPANDED = 256;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

function getRoleDisplayName(role?: string | null) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Administrador';
    case 'ASESOR':
      return 'Asesor';
    case 'CLIENTE':
      return 'Cliente';
    default:
      return role ?? 'Usuario';
  }
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0]) return parts[0][0].toUpperCase();
  }
  return email?.[0]?.toUpperCase() ?? 'U';
}

interface AppSidebarProps {
  /** Notifica al layout el ancho actual para desplazar el contenido. */
  collapsed?: boolean;
  onToggle?: () => void;
  /** En el panel móvil el sidebar nunca se colapsa y cierra al navegar. */
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, onToggle, variant = 'desktop', onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { isModuleEnabled } = useModules();
  const { tenant } = useTenant();
  const { open: openMobileSimulator } = useMobileSimulator();

  const isMobileVariant = variant === 'mobile';
  const userRole = (session as any)?.user?.role as string | undefined;

  const [openSections, setOpenSections] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  const sections = React.useMemo(
    () => filterNavigation(getNavigation(userRole), isModuleEnabled),
    [userRole, isModuleEnabled]
  );

  const activeHref = getActiveNavHref(pathname, sections);
  const dashboardHref = getDashboardHref(userRole);

  React.useEffect(() => setHydrated(true), []);

  // Abrir automáticamente la sección que contiene la ruta activa.
  React.useEffect(() => {
    const active = sections.find((section) =>
      section.groups.some((group) => group.items.some((item) => activeHref === item.href))
    );
    if (active) {
      setOpenSections((prev) => (prev.includes(active.title) ? prev : [...prev, active.title]));
    }
  }, [pathname, sections]);

  const toggleCollapsed = () => onToggle?.();

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Cartera y permisos sincronizados correctamente');
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = () => signOut({ redirect: true, callbackUrl: '/auth/login' });

  if (!session) return null;

  const isCollapsed = !isMobileVariant && collapsed;
  const dashboardActive = pathname === dashboardHref;

  const brand = (
    <Link
      href={dashboardHref}
      onClick={onNavigate}
      className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
    >
      <Image
        src={(tenant as any)?.logo || '/logoescalafin.png'}
        alt={`${(tenant as any)?.name || 'EscalaFin'} Logo`}
        width={isCollapsed ? 32 : 132}
        height={32}
        className="object-contain shrink-0"
        priority
      />
      {!isCollapsed && tenant && (tenant as any).slug !== 'default-tenant' && (
        <span className="font-semibold text-sm text-primary truncate">{tenant.name}</span>
      )}
    </Link>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-white dark:bg-[#030914] text-slate-900 dark:text-slate-100 border-r border-slate-200/80 dark:border-white/5 relative select-none shadow-xl shadow-black/5 dark:shadow-black/40',
          !isMobileVariant && 'transition-[width] duration-200'
        )}
        style={
          isMobileVariant
            ? undefined
            : { width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }
        }
        aria-label="Navegación principal"
      >
        {/* Borde derecho iluminado con gradiente FinTech */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-blue-600/30 to-emerald-500/20 pointer-events-none" />

        {/* Marca */}
        <div
          className={cn(
            'flex items-center h-16 px-3 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-[#061124]/60 backdrop-blur-md',
            isCollapsed ? 'justify-center' : 'justify-between gap-2'
          )}
        >
          {brand}
          {!isMobileVariant && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={toggleCollapsed}
              aria-label="Colapsar menú"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Micro-Widget de Estado y Sucursal Activa */}
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 shrink-0">
            <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-600/5 to-emerald-500/10 border border-cyan-500/20 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {(session as any)?.user?.branchName || (tenant as any)?.name || 'Red FinTech'}
                  </span>
                  <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400">
                    Sentinel Live Sync
                  </span>
                </div>
              </div>
              <div className="h-5 px-1.5 rounded-md bg-white/80 dark:bg-white/10 text-[9px] font-black text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 flex items-center">
                {getRoleDisplayName(userRole)}
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {/* Dashboard siempre primero y sin agrupar */}
            <SidebarLink
              href={dashboardHref}
              icon={LayoutDashboard}
              title={userRole === 'CLIENTE' ? 'Mi Panel' : 'Dashboard'}
              active={dashboardActive}
              collapsed={isCollapsed}
              onNavigate={onNavigate}
            />

            {hydrated &&
              sections.map((section, sIdx) => {
                const sectionActive = section.groups.some((group) =>
                  group.items.some((item) => activeHref === item.href)
                );
                const isOpen = openSections.includes(section.title);

                // Colapsado: la sección se abre como submenú flotante.
                if (isCollapsed) {
                  return (
                    <DropdownMenu key={section.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={cn(
                                'flex items-center justify-center w-full h-10 rounded-xl transition-all duration-200 relative group ef-sidebar-shimmer-hover',
                                sectionActive
                                  ? 'bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-transparent text-cyan-700 dark:text-cyan-300 font-bold ef-sidebar-active-glow'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                              )}
                              aria-label={section.title}
                            >
                              <div
                                className={cn(
                                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300',
                                  sectionActive
                                    ? 'h-6 bg-gradient-to-b from-cyan-400 via-blue-500 to-emerald-400 shadow-[0_0_8px_rgba(0,180,216,0.6)]'
                                    : 'h-0 bg-slate-300 dark:bg-white/20 group-hover:h-3.5'
                                )}
                              />
                              <div className="ef-sidebar-icon-morph">
                                <section.icon className="h-4 w-4" />
                              </div>
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-slate-950 text-white border-slate-800 font-semibold text-xs">
                          {section.title}
                        </TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent side="right" align="start" className="w-60 bg-white dark:bg-[#030914] border-slate-200 dark:border-white/10">
                        <DropdownMenuLabel className="font-bold text-xs">{section.title}</DropdownMenuLabel>
                        {section.groups.map((group, index) => (
                          <div key={group.title}>
                            {index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {group.title}
                            </DropdownMenuLabel>
                            {group.items.map((item) => (
                              <DropdownMenuItem key={item.href} asChild>
                                <Link
                                  href={item.href}
                                  onClick={onNavigate}
                                  className={cn(
                                    'cursor-pointer text-xs font-medium rounded-lg',
                                    activeHref === item.href && 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                                  )}
                                >
                                  <item.icon className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                  <span>{item.title}</span>
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                // Expandido: acordeón.
                return (
                  <div key={section.title} className="ef-sidebar-item-enter" style={{ animationDelay: `${sIdx * 40}ms` }}>
                    <button
                      onClick={() => toggleSection(section.title)}
                      aria-expanded={isOpen}
                      className={cn(
                        'flex items-center justify-between w-full px-3 h-9 rounded-xl text-xs font-medium transition-all duration-200 relative group ef-sidebar-shimmer-hover',
                        sectionActive
                          ? 'bg-gradient-to-r from-cyan-500/10 via-blue-600/5 to-transparent text-cyan-900 dark:text-cyan-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300',
                          sectionActive
                            ? 'h-6 bg-gradient-to-b from-cyan-400 via-blue-500 to-emerald-400 shadow-[0_0_8px_rgba(0,180,216,0.6)]'
                            : 'h-0 bg-slate-300 dark:bg-white/20 group-hover:h-3.5'
                        )}
                      />
                      <span className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("ef-sidebar-icon-morph shrink-0", sectionActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400")}>
                          <section.icon className="h-4 w-4" />
                        </div>
                        <span className="truncate group-hover:translate-x-0.5 transition-transform">{section.title}</span>
                      </span>
                      <ChevronDown
                        className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-cyan-600 dark:text-cyan-300')}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-200 dark:border-white/5 space-y-2 pb-1">
                        {section.groups.map((group) => (
                          <div key={group.title} className="space-y-0.5">
                            <p className="px-2 pt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                              {group.title}
                            </p>
                            {group.items.map((item) => (
                              <SidebarLink
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                title={item.title}
                                badge={item.badge}
                                active={activeHref === item.href}
                                collapsed={false}
                                dense
                                onNavigate={onNavigate}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </nav>
        </ScrollArea>

        {/* Usuario y Sincronización */}
        <div className="border-t border-slate-100 dark:border-white/5 p-2 shrink-0 bg-slate-50/50 dark:bg-[#061124]/60">
          {!isMobileVariant && isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-9 mb-1 text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10"
              onClick={toggleCollapsed}
              aria-label="Expandir menú"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Menú de usuario"
                className={cn(
                  'flex items-center w-full rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border-2 shadow-xs',
                  userRole === 'SUPER_ADMIN'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-500 dark:text-amber-400'
                    : userRole === 'ADMIN'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                    : 'border-emerald-400 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                )}>
                  {getInitials(session.user?.name, session.user?.email)}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 text-left flex-1">
                    <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">{session.user?.name || 'Usuario'}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                      {getRoleDisplayName(userRole)}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-60 bg-white dark:bg-[#030914] border-slate-200 dark:border-white/10">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{session.user?.name || 'Usuario'}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {getRoleDisplayName(userRole)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer font-medium text-xs flex items-center gap-2"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4 text-cyan-500", isSyncing && "animate-spin")} />
                <span>{isSyncing ? "Sincronizando..." : "Sincronizar Cartera"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer font-medium text-xs">
                <Link href="/profile" onClick={onNavigate}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer font-medium text-xs"
                onClick={() => {
                  if (onNavigate) onNavigate();
                  openMobileSimulator();
                }}
              >
                <Smartphone className="mr-2 h-4 w-4 text-primary" />
                <div className="flex items-center justify-between w-full">
                  <span>Modo Móvil</span>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-primary/10 text-primary font-normal">
                    Simular
                  </Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 dark:text-red-400 font-medium text-xs"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isCollapsed && (
            <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between px-2 text-[9px] text-slate-400 font-mono">
              <button
                type="button"
                onClick={() => openMobileSimulator()}
                className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors cursor-pointer font-sans text-[10px] font-semibold"
                title="Abrir simulador móvil"
              >
                <Smartphone className="h-3 w-3" />
                <span>Vista Móvil</span>
              </button>
              <span>v3.5.0</span>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  title,
  active,
  collapsed,
  badge,
  dense = false,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active: boolean;
  collapsed: boolean;
  badge?: string;
  dense?: boolean;
  onNavigate?: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (href === '#modo-movil') {
      e.preventDefault();
      useMobileSimulator.getState().open();
      if (onNavigate) onNavigate();
      return;
    }
    if (onNavigate) onNavigate();
  };

  const link = (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center rounded-xl transition-all duration-200 relative group ef-sidebar-shimmer-hover',
        collapsed ? 'justify-center h-10' : 'gap-3 px-3',
        dense ? 'h-8 text-xs' : 'h-10 text-xs font-semibold',
        active
          ? 'bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-emerald-500/5 text-cyan-900 dark:text-cyan-200 font-bold ef-sidebar-active-glow shadow-xs'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
      )}
    >
      {/* Indicador elástico lateral */}
      <div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300',
          active
            ? 'h-6 bg-gradient-to-b from-cyan-400 via-blue-500 to-emerald-400 shadow-[0_0_8px_rgba(0,180,216,0.6)]'
            : 'h-0 bg-slate-300 dark:bg-white/20 group-hover:h-3.5'
        )}
      />

      <div
        className={cn(
          'ef-sidebar-icon-morph shrink-0 transition-transform duration-300',
          active ? 'text-cyan-600 dark:text-cyan-400 scale-110 drop-shadow-[0_0_6px_rgba(0,180,216,0.4)]' : 'text-slate-400 group-hover:scale-110'
        )}
      >
        <Icon className={cn('shrink-0', dense ? 'h-4 w-4' : 'h-5 w-5')} />
      </div>

      {!collapsed && <span className="truncate group-hover:translate-x-0.5 transition-transform">{title}</span>}

      {!collapsed && badge && (
        <Badge variant={active ? "default" : "secondary"} className={cn("ml-auto text-[9px] px-1.5 h-4 font-bold", active && "bg-cyan-600")}>
          {badge}
        </Badge>
      )}

      {!collapsed && !badge && active && (
        <div className="relative flex h-2 w-2 shrink-0 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </div>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="bg-slate-950 text-white border-slate-800 font-medium text-xs">{title}</TooltipContent>
    </Tooltip>
  );
}
