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
} from 'lucide-react';
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
          'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          !isMobileVariant && 'transition-[width] duration-200'
        )}
        style={
          isMobileVariant
            ? undefined
            : { width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }
        }
        aria-label="Navegación principal"
      >
        {/* Marca */}
        <div
          className={cn(
            'flex items-center h-16 px-3 border-b border-gray-200 dark:border-gray-800 shrink-0',
            isCollapsed ? 'justify-center' : 'justify-between gap-2'
          )}
        >
          {brand}
          {!isMobileVariant && !isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={toggleCollapsed}
              aria-label="Colapsar menú"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

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
              sections.map((section) => {
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
                                'flex items-center justify-center w-full h-10 rounded-lg transition-colors',
                                sectionActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              )}
                              aria-label={section.title}
                            >
                              <section.icon className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="right">{section.title}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent side="right" align="start" className="w-60">
                        <DropdownMenuLabel>{section.title}</DropdownMenuLabel>
                        {section.groups.map((group, index) => (
                          <div key={group.title}>
                            {index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                              {group.title}
                            </DropdownMenuLabel>
                            {group.items.map((item) => (
                              <DropdownMenuItem key={item.href} asChild>
                                <Link
                                  href={item.href}
                                  onClick={onNavigate}
                                  className={cn(
                                    'cursor-pointer',
                                    activeHref === item.href && 'bg-primary/10 text-primary'
                                  )}
                                >
                                  <item.icon className="mr-2 h-4 w-4" />
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
                  <div key={section.title}>
                    <button
                      onClick={() => toggleSection(section.title)}
                      aria-expanded={isOpen}
                      className={cn(
                        'flex items-center justify-between w-full px-3 h-10 rounded-lg text-sm font-medium transition-colors',
                        sectionActive
                          ? 'text-primary'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <section.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </span>
                      <ChevronDown
                        className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l border-gray-200 dark:border-gray-800 space-y-3 pb-2">
                        {section.groups.map((group) => (
                          <div key={group.title} className="space-y-0.5">
                            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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

        {/* Usuario */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
          {!isMobileVariant && isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-9 mb-1"
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
                  'flex items-center w-full rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  isCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(session.user?.name, session.user?.email)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{session.user?.name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getRoleDisplayName(userRole)}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{session.user?.name || 'Usuario'}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getRoleDisplayName(userRole)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/profile" onClick={onNavigate}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 dark:text-red-400"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center rounded-lg transition-colors',
        collapsed ? 'justify-center h-10' : 'gap-3 px-3',
        dense ? 'h-8 text-[13px]' : 'h-10 text-sm font-medium',
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      <Icon className={cn('shrink-0', dense ? 'h-4 w-4' : 'h-5 w-5')} />
      {!collapsed && <span className="truncate">{title}</span>}
      {!collapsed && badge && (
        <Badge variant="secondary" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  );
}
